/**
 * Image Enhancement Service using Gemini 2.5 Flash Image (Nano Banana)
 * Enhances portraits for missing person and deceased person alerts
 */

const { getGenerativeModel, IMAGE_ENHANCEMENT_CONFIG } = require('../config/vertexai');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const prisma = new PrismaClient();

/**
 * Check if a category should trigger automatic image enhancement
 * @param {string} categoryCode - Category code (e.g., "DISP", "DECD")
 * @returns {boolean}
 */
function shouldEnhanceImage(categoryCode) {
  return IMAGE_ENHANCEMENT_CONFIG.enhancementCategories.includes(categoryCode);
}

/**
 * Convert image file to base64 for Gemini API
 * @param {string} imagePath - Full path to image file
 * @returns {Promise<{data: string, mimeType: string}>}
 */
async function imageToBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Data = imageBuffer.toString('base64');

    // Detect mime type from file extension
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    return { data: base64Data, mimeType };
  } catch (error) {
    console.error('❌ Error reading image file:', error);
    throw new Error(`Failed to read image: ${error.message}`);
  }
}

/**
 * Save base64 image to file system
 * @param {string} base64Data - Base64 encoded image
 * @param {string} originalPath - Original image path (for directory structure)
 * @param {string} suffix - Suffix to add to filename (e.g., "_enhanced")
 * @returns {Promise<{path: string, url: string, filename: string}>}
 */
async function saveBase64Image(base64Data, originalPath, suffix = '_enhanced') {
  try {
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate enhanced filename
    const parsedPath = path.parse(originalPath);
    const enhancedFilename = `${parsedPath.name}${suffix}${parsedPath.ext}`;
    const enhancedPath = path.join(parsedPath.dir, enhancedFilename);

    // Ensure directory exists
    await fs.mkdir(parsedPath.dir, { recursive: true });

    // Save file
    await fs.writeFile(enhancedPath, buffer);

    console.log(`✅ Enhanced image saved: ${enhancedPath}`);

    return {
      path: enhancedPath,
      url: enhancedPath.replace(/\\/g, '/'), // Convert Windows paths to URL-friendly format
      filename: enhancedFilename,
    };
  } catch (error) {
    console.error('❌ Error saving enhanced image:', error);
    throw new Error(`Failed to save enhanced image: ${error.message}`);
  }
}

/**
 * Get image dimensions using sharp
 * @param {string} imagePath - Path to image file
 * @returns {Promise<{width: number, height: number}>}
 */
async function getImageDimensions(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('❌ Error getting image dimensions:', error);
    return { width: 0, height: 0 };
  }
}

/**
 * Enhance portrait image using Gemini 2.5 Flash Image
 * @param {string} imageId - Database image ID
 * @param {Object} options - Enhancement options
 * @param {string} options.prompt - Custom prompt (optional, uses default if not provided)
 * @param {string} options.categoryCode - Alert category code
 * @returns {Promise<{success: boolean, enhancedImageId?: string, error?: string}>}
 */
async function enhancePortrait(imageId, options = {}) {
  const startTime = Date.now();

  try {
    console.log(`🎨 Starting image enhancement for image ID: ${imageId}`);

    // 1. Retrieve original image from database
    const originalImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!originalImage) {
      throw new Error(`Image not found: ${imageId}`);
    }

    if (originalImage.isEnhanced) {
      console.log(`ℹ️ Image ${imageId} is already enhanced, skipping`);
      return { success: false, error: 'Image already enhanced' };
    }

    // 2. Read image file and convert to base64
    const fullPath = path.resolve(originalImage.path);
    const { data: base64Data, mimeType } = await imageToBase64(fullPath);

    // 3. Get Gemini model
    const model = getGenerativeModel();

    // 4. Prepare prompt
    const prompt = options.prompt || IMAGE_ENHANCEMENT_CONFIG.prompts.portraitEnhancement;

    // 5. Call Gemini API for image enhancement
    console.log(`📡 Calling Gemini 2.5 Flash Image API...`);

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
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

    // 6. Extract generated image from response
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

    // 7. Save enhanced image to file system
    const { path: enhancedPath, url: enhancedUrl, filename } = await saveBase64Image(
      enhancedImageData,
      originalImage.path,
      '_enhanced'
    );

    // 8. Get enhanced image file size and dimensions
    const stats = await fs.stat(enhancedPath);
    const dimensions = await getImageDimensions(enhancedPath);
    const processingTime = Date.now() - startTime;

    // 9. Create enhanced image record in database
    const enhancedImage = await prisma.image.create({
      data: {
        filename,
        originalName: `${originalImage.originalName}_enhanced`,
        path: enhancedPath,
        url: enhancedUrl,
        size: stats.size,
        mimeType: originalImage.mimeType,
        width: dimensions.width,
        height: dimensions.height,
        category: originalImage.category,
        isPublic: originalImage.isPublic,
        storage: 'local',

        // AI Enhancement fields
        isEnhanced: true,
        originalImageId: originalImage.id,
        enhancementMetadata: {
          model: 'gemini-2.5-flash-image',
          prompt: prompt.substring(0, 200), // Store first 200 chars of prompt
          processingTime: processingTime,
          cost: IMAGE_ENHANCEMENT_CONFIG.pricing.costPerImage,
          timestamp: new Date().toISOString(),
          categoryCode: options.categoryCode || 'unknown',
        },

        // Relations
        alertId: originalImage.alertId,
        userId: originalImage.userId,
        uploadedBy: originalImage.uploadedBy,
      },
    });

    console.log(`✅ Image enhancement completed in ${processingTime}ms - Enhanced image ID: ${enhancedImage.id}`);

    return {
      success: true,
      enhancedImageId: enhancedImage.id,
      enhancedImageUrl: enhancedUrl,
      processingTime,
      cost: IMAGE_ENHANCEMENT_CONFIG.pricing.costPerImage,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Image enhancement failed after ${processingTime}ms:`, error);

    return {
      success: false,
      error: error.message,
      processingTime,
    };
  }
}

/**
 * Enhance image for alert (wrapper with category detection)
 * @param {string} imageId - Image database ID
 * @param {string} alertId - Alert database ID (optional, for category detection)
 * @returns {Promise<Object>}
 */
async function enhanceAlertImage(imageId, alertId = null) {
  try {
    // If alertId provided, get category to check if enhancement needed
    let categoryCode = null;

    if (alertId) {
      const alert = await prisma.alert.findUnique({
        where: { id: alertId },
        select: { category: true },
      });

      if (alert) {
        categoryCode = alert.category;
      }
    }

    // Check if category requires enhancement
    if (categoryCode && !shouldEnhanceImage(categoryCode)) {
      console.log(`ℹ️ Category ${categoryCode} does not require enhancement, skipping`);
      return { success: false, error: 'Category does not require enhancement' };
    }

    // Enhance image
    return await enhancePortrait(imageId, { categoryCode });

  } catch (error) {
    console.error('❌ Error in enhanceAlertImage:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update alert to use enhanced image as primary media
 * @param {string} alertId - Alert ID
 * @param {string} enhancedImageUrl - URL of enhanced image
 * @returns {Promise<void>}
 */
async function updateAlertWithEnhancedImage(alertId, enhancedImageUrl) {
  try {
    await prisma.alert.update({
      where: { id: alertId },
      data: { mediaUrl: enhancedImageUrl },
    });
    console.log(`✅ Alert ${alertId} updated with enhanced image`);
  } catch (error) {
    console.error(`❌ Error updating alert with enhanced image:`, error);
    throw error;
  }
}

module.exports = {
  shouldEnhanceImage,
  enhancePortrait,
  enhanceAlertImage,
  updateAlertWithEnhancedImage,
  IMAGE_ENHANCEMENT_CONFIG,
};
