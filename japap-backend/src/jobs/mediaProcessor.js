/**
 * Media Processor - Asynchronous job processing for media files
 * Uses Bull queue with Redis for job management
 */

const Queue = require('bull');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { getGenerativeModel, IMAGE_ENHANCEMENT_CONFIG } = require('../config/vertexai');

const prisma = new PrismaClient();

// ============ CONFIGURATION ============

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const QUEUE_OPTIONS = {
  redis: REDIS_CONFIG,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
  settings: {
    maxRetriesPerRequest: 1, // Reduce retries to fail fast if Redis is down
    retryStrategy: (times) => {
      if (times > 1) {
        return null; // Stop retrying after 1 attempt
      }
      return 100; // Wait 100ms before retry
    },
  },
};

// Thumbnail sizes
const THUMBNAIL_SIZES = {
  THUMBNAIL: { width: 150, height: 150, fit: 'cover' },
  MEDIUM: { width: 800, height: 600, fit: 'inside' },
  LARGE: { width: 1920, height: 1080, fit: 'inside' },
};

// ============ CREATE QUEUES ============

let mediaQueue = null;
let redisAvailable = false;

// Try to create queue, but don't fail if Redis is unavailable
try {
  mediaQueue = new Queue('media-processing', QUEUE_OPTIONS);
  redisAvailable = true;
  console.log('✅ Redis connected - Bull queue initialized');
} catch (error) {
  console.warn('⚠️  Redis unavailable - Media processing jobs will be skipped');
  console.warn('   Install and start Redis to enable async media processing (thumbnails, transcriptions, etc.)');
  redisAvailable = false;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Get full file path from media record
 */
function getFullPath(mediaPath) {
  if (path.isAbsolute(mediaPath)) {
    return mediaPath;
  }
  return path.join(process.cwd(), 'public', mediaPath);
}

/**
 * Get media directory (where original file is stored)
 */
function getMediaDir(media) {
  const fullPath = getFullPath(media.path);
  return path.dirname(fullPath);
}

/**
 * Convert image to base64 for Gemini API
 */
async function imageToBase64(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  const base64Data = imageBuffer.toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/jpeg', // Convert HEIC to JPEG
  };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  return { data: base64Data, mimeType };
}

// ============ JOB PROCESSORS ============

/**
 * Generate thumbnails for images
 * Job data: { mediaId }
 */
if (mediaQueue) {
  mediaQueue.process('generate-thumbnails', async (job) => {
  const { mediaId } = job.data;
  console.log(`🖼️  [${job.id}] Generating thumbnails for media ${mediaId}`);

  try {
    // Get media from database
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error(`Media ${mediaId} not found`);
    }

    if (media.type !== 'IMAGE') {
      throw new Error(`Media ${mediaId} is not an image (type: ${media.type})`);
    }

    const originalPath = getFullPath(media.path);
    const mediaDir = getMediaDir(media);
    const ext = path.extname(media.filename);

    // Verify original file exists
    try {
      await fs.access(originalPath);
    } catch (error) {
      throw new Error(`Original file not found: ${originalPath}`);
    }

    // Generate thumbnails
    const derivatives = [];

    for (const [derivativeType, size] of Object.entries(THUMBNAIL_SIZES)) {
      const filename = `${media.id}-${derivativeType.toLowerCase()}${ext}`;
      const derivativePath = path.join(mediaDir, filename);

      // Generate thumbnail
      await sharp(originalPath)
        .resize(size.width, size.height, { fit: size.fit })
        .jpeg({ quality: 85 })
        .toFile(derivativePath);

      // Get file stats
      const stats = await fs.stat(derivativePath);
      const metadata = await sharp(derivativePath).metadata();

      // Create MediaDerivative record
      const derivative = await prisma.mediaDerivative.create({
        data: {
          mediaId: media.id,
          derivativeType,
          filename,
          path: derivativePath.replace(/\\/g, '/'),
          url: derivativePath.replace(/\\/g, '/').replace(path.join(process.cwd(), 'public').replace(/\\/g, '/'), ''),
          size: stats.size,
          mimeType: 'image/jpeg',
          width: metadata.width,
          height: metadata.height,
          generatedBy: 'sharp',
          metadata: {
            quality: 85,
            fit: size.fit,
            originalWidth: media.width,
            originalHeight: media.height,
          },
        },
      });

      derivatives.push(derivative);
      console.log(`✅ Generated ${derivativeType}: ${derivative.url}`);
    }

    // Update job progress
    await job.progress(100);

    return {
      success: true,
      mediaId,
      derivativesCreated: derivatives.length,
      derivatives: derivatives.map(d => ({ type: d.derivativeType, url: d.url })),
    };

  } catch (error) {
    console.error(`❌ [${job.id}] Thumbnail generation failed:`, error);
    throw error;
  }
});
}

/**
 * AI enhancement for DISP/DECD images
 * Job data: { mediaId, alertId, categoryCode }
 */
if (mediaQueue) {
  mediaQueue.process('ai-enhancement', async (job) => {
  const { mediaId, alertId, categoryCode } = job.data;
  console.log(`🎨 [${job.id}] Enhancing image ${mediaId} (category: ${categoryCode})`);

  const startTime = Date.now();

  try {
    // Get media from database
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error(`Media ${mediaId} not found`);
    }

    if (media.type !== 'IMAGE') {
      throw new Error(`Media ${mediaId} is not an image`);
    }

    if (media.isEnhanced) {
      console.log(`ℹ️  Media ${mediaId} is already enhanced, skipping`);
      return { success: false, error: 'Already enhanced' };
    }

    // Check if category requires enhancement
    if (!IMAGE_ENHANCEMENT_CONFIG.enhancementCategories.includes(categoryCode)) {
      console.log(`ℹ️  Category ${categoryCode} does not require enhancement`);
      return { success: false, error: 'Category does not require enhancement' };
    }

    // Read original image
    const originalPath = getFullPath(media.path);
    const { data: base64Data, mimeType } = await imageToBase64(originalPath);

    // Get Gemini model
    const model = getGenerativeModel();

    // Prepare prompt
    const prompt = IMAGE_ENHANCEMENT_CONFIG.prompts.portraitEnhancement;

    // Call Gemini API
    console.log(`📡 [${job.id}] Calling Gemini 2.5 Flash Image API...`);
    await job.progress(30);

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: IMAGE_ENHANCEMENT_CONFIG.modelConfig,
      safetySettings: IMAGE_ENHANCEMENT_CONFIG.safetySettings,
    };

    const response = await model.generateContent(request);
    const result = response.response;

    await job.progress(60);

    // Extract enhanced image
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini API');
    }

    const candidate = result.candidates[0];
    const parts = candidate.content.parts;

    let enhancedImageData = null;
    for (const part of parts) {
      if (part.inlineData) {
        enhancedImageData = part.inlineData.data;
        break;
      }
    }

    if (!enhancedImageData) {
      throw new Error('No image data in Gemini response');
    }

    // Save enhanced image
    const mediaDir = getMediaDir(media);
    const ext = path.extname(media.filename);
    const enhancedFilename = `${media.id}-enhanced${ext}`;
    const enhancedPath = path.join(mediaDir, enhancedFilename);

    const buffer = Buffer.from(enhancedImageData, 'base64');
    await fs.writeFile(enhancedPath, buffer);

    await job.progress(80);

    // Get enhanced image stats
    const stats = await fs.stat(enhancedPath);
    const metadata = await sharp(enhancedPath).metadata();
    const processingTime = Date.now() - startTime;

    // Create enhanced Media record
    const enhancedMedia = await prisma.media.create({
      data: {
        type: 'IMAGE',
        position: null, // Enhanced versions don't have positions
        alertId: media.alertId,
        userId: media.userId,
        uploadedBy: media.uploadedBy,

        filename: enhancedFilename,
        originalName: `${media.originalName}_enhanced`,
        path: enhancedPath.replace(/\\/g, '/'),
        url: enhancedPath.replace(/\\/g, '/').replace(path.join(process.cwd(), 'public').replace(/\\/g, '/'), ''),
        size: stats.size,
        mimeType: media.mimeType,

        checksum: media.checksum, // Keep same checksum reference
        capturedAt: media.capturedAt,

        width: metadata.width,
        height: metadata.height,

        uploadStatus: 'COMPLETED',

        // AI Enhancement fields
        isEnhanced: true,
        originalMediaId: media.id,
        enhancementMetadata: {
          model: 'gemini-2.5-flash-image',
          prompt: prompt.substring(0, 200),
          processingTime,
          cost: IMAGE_ENHANCEMENT_CONFIG.pricing.costPerImage,
          timestamp: new Date().toISOString(),
          categoryCode,
        },
      },
    });

    await job.progress(100);

    console.log(`✅ [${job.id}] Image enhancement completed in ${processingTime}ms`);

    return {
      success: true,
      mediaId,
      enhancedMediaId: enhancedMedia.id,
      enhancedUrl: enhancedMedia.url,
      processingTime,
      cost: IMAGE_ENHANCEMENT_CONFIG.pricing.costPerImage,
    };

  } catch (error) {
    console.error(`❌ [${job.id}] AI enhancement failed:`, error);
    throw error;
  }
});
}

/**
 * Transcribe audio using OpenAI Whisper
 * Job data: { mediaId }
 */
if (mediaQueue) {
  mediaQueue.process('transcribe-audio', async (job) => {
  const { mediaId } = job.data;
  console.log(`🎙️  [${job.id}] Transcribing audio ${mediaId}`);

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Get media from database
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error(`Media ${mediaId} not found`);
    }

    if (media.type !== 'AUDIO') {
      throw new Error(`Media ${mediaId} is not audio (type: ${media.type})`);
    }

    // Check if transcription already exists
    const existing = await prisma.transcription.findFirst({
      where: { mediaId, source: 'AUTO' },
    });

    if (existing) {
      console.log(`ℹ️  Transcription already exists for media ${mediaId}`);
      return { success: false, error: 'Transcription already exists' };
    }

    const originalPath = getFullPath(media.path);

    // Call OpenAI Whisper API
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log(`📡 [${job.id}] Calling OpenAI Whisper API...`);
    await job.progress(30);

    const audioFile = await fs.readFile(originalPath);
    const response = await openai.audio.transcriptions.create({
      file: new File([audioFile], media.filename, { type: media.mimeType }),
      model: 'whisper-1',
      response_format: 'verbose_json',
      language: 'fr', // Default to French, can be customized
    });

    await job.progress(80);

    // Create transcription record
    const transcription = await prisma.transcription.create({
      data: {
        mediaId: media.id,
        text: response.text,
        language: response.language || 'fr',
        confidence: null, // Whisper doesn't provide overall confidence
        version: 1, // First version
        source: 'AUTO',
        model: 'openai-whisper-1',
        isActive: true, // First transcription is active
        metadata: {
          duration: response.duration,
          segments: response.segments?.length || 0,
          timestamp: new Date().toISOString(),
        },
      },
    });

    await job.progress(100);

    console.log(`✅ [${job.id}] Audio transcribed: ${response.text.substring(0, 100)}...`);

    return {
      success: true,
      mediaId,
      transcriptionId: transcription.id,
      text: transcription.text,
      language: transcription.language,
      duration: response.duration,
    };

  } catch (error) {
    console.error(`❌ [${job.id}] Audio transcription failed:`, error);
    throw error;
  }
});
}

/**
 * Generate waveform visualization for audio
 * Job data: { mediaId }
 */
if (mediaQueue) {
  mediaQueue.process('generate-waveform', async (job) => {
  const { mediaId } = job.data;
  console.log(`🌊 [${job.id}] Generating waveform for audio ${mediaId}`);

  try {
    // Note: Waveform generation requires ffmpeg and additional libraries
    // This is a placeholder implementation
    console.log(`ℹ️  Waveform generation not yet implemented (requires ffmpeg + audiowaveform)`);

    return {
      success: false,
      error: 'Waveform generation not implemented yet',
      mediaId,
    };

  } catch (error) {
    console.error(`❌ [${job.id}] Waveform generation failed:`, error);
    throw error;
  }
});
}

/**
 * Generate video preview (10s clip)
 * Job data: { mediaId }
 */
if (mediaQueue) {
  mediaQueue.process('generate-video-preview', async (job) => {
  const { mediaId } = job.data;
  console.log(`🎬 [${job.id}] Generating video preview for ${mediaId}`);

  try {
    // Note: Video preview generation requires ffmpeg
    // This is a placeholder implementation
    console.log(`ℹ️  Video preview generation not yet implemented (requires ffmpeg)`);

    return {
      success: false,
      error: 'Video preview generation not implemented yet',
      mediaId,
    };

  } catch (error) {
    console.error(`❌ [${job.id}] Video preview generation failed:`, error);
    throw error;
  }
});
}

/**
 * Generate video thumbnail (extract frame)
 * Job data: { mediaId }
 */
if (mediaQueue) {
  mediaQueue.process('generate-video-thumbnail', async (job) => {
  const { mediaId } = job.data;
  console.log(`📸 [${job.id}] Generating video thumbnail for ${mediaId}`);

  try {
    // Note: Video thumbnail generation requires ffmpeg
    // This is a placeholder implementation
    console.log(`ℹ️  Video thumbnail generation not yet implemented (requires ffmpeg)`);

    return {
      success: false,
      error: 'Video thumbnail generation not implemented yet',
      mediaId,
    };

  } catch (error) {
    console.error(`❌ [${job.id}] Video thumbnail generation failed:`, error);
    throw error;
  }
});
}

// ============ JOB EVENTS ============

if (mediaQueue) {
  // Log job completion
  mediaQueue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} (${job.name}) completed:`, result);
  });

  // Log job failure
  mediaQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} (${job.name}) failed:`, err.message);
  });

  // Log job progress
  mediaQueue.on('progress', (job, progress) => {
    console.log(`⏳ Job ${job.id} (${job.name}) progress: ${progress}%`);
  });
}

// ============ QUEUE HELPERS ============

/**
 * Add job to media processing queue
 * @param {string} jobName - Job type (generate-thumbnails, ai-enhancement, etc.)
 * @param {Object} data - Job data
 * @param {Object} options - Job options (priority, delay, etc.)
 */
async function enqueueMediaJob(jobName, data, options = {}) {
  // If Redis is unavailable, log warning and skip job
  if (!redisAvailable || !mediaQueue) {
    console.warn(`⚠️  Skipping job ${jobName} for media ${data.mediaId} (Redis unavailable)`);
    return null;
  }

  try {
    const job = await mediaQueue.add(jobName, data, {
      ...options,
      priority: options.priority || 10, // Default priority
    });

    console.log(`📋 Enqueued job ${job.id} (${jobName}) for media ${data.mediaId}`);
    return job;

  } catch (error) {
    console.error(`❌ Failed to enqueue job ${jobName}:`, error);
    // Don't throw error, just log it (allow uploads to proceed)
    return null;
  }
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
  if (!redisAvailable || !mediaQueue) {
    return null;
  }

  const job = await mediaQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress();

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    state,
    progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  };
}

/**
 * Get queue stats
 */
async function getQueueStats() {
  if (!redisAvailable || !mediaQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      redisAvailable: false,
    };
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    mediaQueue.getWaitingCount(),
    mediaQueue.getActiveCount(),
    mediaQueue.getCompletedCount(),
    mediaQueue.getFailedCount(),
    mediaQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
    redisAvailable: true,
  };
}

// ============ CLEANUP ============

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing media queue...');
  if (mediaQueue) {
    await mediaQueue.close();
  }
  await prisma.$disconnect();
});

// ============ EXPORTS ============

module.exports = {
  mediaQueue,
  enqueueMediaJob,
  getJobStatus,
  getQueueStats,
  THUMBNAIL_SIZES,
  redisAvailable,
};
