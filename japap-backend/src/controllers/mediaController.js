/**
 * Media Controller - Gestion unifiée des médias (images, audio, vidéo)
 * Workflow: initiate → upload → complete
 */

const prisma = require('../config/prismaClient');
const { validateMediaInitiation, validateMediaFile } = require('../utils/mediaValidation');
const { enqueueMediaJob, redisAvailable } = require('../jobs/mediaProcessor');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const UPLOAD_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/alerts/:alertId/media/initiate
 * Réserve un slot pour upload média
 */
exports.initiateMediaUpload = async (req, res) => {
  const { alertId } = req.params;
  const { type, position, filename, mimeType, size, checksum, capturedAt, metadata } = req.body;

  try {
    // 1. Vérifier que l'alerte existe
    const alert = await prisma.alert.findUnique({
      where: { id: alertId }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alerte introuvable'
      });
    }

    // 2. Valider les métadonnées
    const validation = await validateMediaInitiation({
      type,
      position,
      filename,
      mimeType,
      size,
      alertId
    }, prisma);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // 3. Générer mediaId
    const mediaId = crypto.randomUUID();

    // 4. Générer uploadToken JWT (expire dans 5 min)
    const uploadToken = jwt.sign(
      { mediaId, alertId, type, mimeType },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    const uploadExpiry = new Date(Date.now() + UPLOAD_TOKEN_EXPIRY);

    // 5. Créer enregistrement Media avec uploadStatus = PENDING
    const media = await prisma.media.create({
      data: {
        id: mediaId,
        type,
        position: position || null,
        alertId,
        filename: `${mediaId}-original${path.extname(filename)}`,
        originalName: filename,
        path: '', // Sera rempli après upload
        url: '',
        size,
        mimeType,
        checksum: checksum || '',
        capturedAt: capturedAt ? new Date(capturedAt) : null,
        metadata: metadata || {},
        uploadStatus: 'PENDING',
        uploadToken,
        uploadExpiry,
      }
    });

    console.log(`✅ [${mediaId}] Slot réservé pour ${type} (alerte: ${alertId})`);

    // 6. Retourner uploadUrl et token
    res.json({
      success: true,
      mediaId: media.id,
      uploadUrl: `/api/uploads/presigned/${media.id}`,
      uploadToken,
      expiresAt: uploadExpiry.toISOString(),
      message: `Slot réservé. Uploadez le fichier avant ${uploadExpiry.toLocaleTimeString('fr-FR')}`
    });

  } catch (error) {
    console.error('Erreur lors de l\'initiation upload:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'initiation upload'
    });
  }
};

/**
 * PUT /api/uploads/presigned/:mediaId
 * Upload du fichier binaire avec validation
 */
exports.uploadMediaFile = async (req, res) => {
  const { mediaId } = req.params;
  const uploadToken = req.headers.authorization?.replace('Bearer ', '');
  const declaredChecksum = req.headers['x-checksum'];

  try {
    // 1. Vérifier que le fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // 2. Récupérer le média
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { alert: true }
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Média introuvable'
      });
    }

    // 3. Vérifier le token
    if (!uploadToken || uploadToken !== media.uploadToken) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'upload invalide ou manquant'
      });
    }

    // 4. Vérifier expiration
    if (new Date() > media.uploadExpiry) {
      await prisma.media.update({
        where: { id: mediaId },
        data: { uploadStatus: 'FAILED', uploadError: 'Token expiré' }
      });

      return res.status(401).json({
        success: false,
        error: 'Token d\'upload expiré. Veuillez réinitier l\'upload.'
      });
    }

    // 5. Vérifier que le média n'a pas déjà été uploadé
    if (media.uploadStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Upload déjà ${media.uploadStatus.toLowerCase()}`
      });
    }

    // 6. Valider le fichier binaire
    console.log(`📦 [${mediaId}] Validation fichier ${media.type} (${req.file.size} bytes)...`);

    const validation = await validateMediaFile(
      req.file.buffer,
      media.type,
      media.mimeType,
      declaredChecksum
    );

    if (!validation.valid) {
      await prisma.media.update({
        where: { id: mediaId },
        data: {
          uploadStatus: 'FAILED',
          uploadError: validation.errors.join('; ')
        }
      });

      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // 7. Créer la structure de répertoires
    const alertId = media.alertId;
    const mediaDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'alerts',
      alertId,
      'media',
      mediaId
    );

    await fs.mkdir(mediaDir, { recursive: true });

    // 8. Sauvegarder le fichier original
    const ext = path.extname(media.originalName);
    const filename = `original${ext}`;
    const filePath = path.join(mediaDir, filename);

    await fs.writeFile(filePath, req.file.buffer);

    // 9. Construire URL
    const relativePath = `/uploads/alerts/${alertId}/media/${mediaId}/${filename}`;

    // 10. Mettre à jour le média
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        path: relativePath,
        url: relativePath,
        size: req.file.size,
        checksum: validation.checksum,
        width: validation.metadata.width || null,
        height: validation.metadata.height || null,
        duration: validation.metadata.duration || null,
        metadata: {
          ...media.metadata,
          ...validation.metadata,
          actualMimeType: validation.actualMimeType
        },
        uploadStatus: 'PROCESSING',
        uploadError: null
      }
    });

    console.log(`✅ [${mediaId}] Fichier uploadé: ${relativePath} (${(req.file.size / 1024).toFixed(2)} KB)`);

    res.json({
      success: true,
      mediaId: updatedMedia.id,
      uploadStatus: 'PROCESSING',
      message: 'Upload terminé. Finalisez avec /complete pour générer les dérivés.',
      media: {
        id: updatedMedia.id,
        type: updatedMedia.type,
        url: updatedMedia.url,
        size: updatedMedia.size,
        checksum: updatedMedia.checksum,
        metadata: updatedMedia.metadata
      }
    });

  } catch (error) {
    console.error(`❌ [${mediaId}] Erreur upload:`, error);

    // Marquer comme failed
    try {
      await prisma.media.update({
        where: { id: mediaId },
        data: {
          uploadStatus: 'FAILED',
          uploadError: error.message
        }
      });
    } catch (updateError) {
      console.error('Erreur mise à jour statut:', updateError);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload'
    });
  }
};

/**
 * POST /api/alerts/:alertId/media/:mediaId/complete
 * Finalise l'upload et déclenche jobs asynchrones
 */
exports.completeMediaUpload = async (req, res) => {
  const { alertId, mediaId } = req.params;

  try {
    // 1. Récupérer le média
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { alert: true }
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Média introuvable'
      });
    }

    if (media.alertId !== alertId) {
      return res.status(400).json({
        success: false,
        error: 'Média ne correspond pas à l\'alerte'
      });
    }

    // 2. Vérifier uploadStatus
    if (media.uploadStatus !== 'PROCESSING') {
      return res.status(400).json({
        success: false,
        error: `Upload non finalisable. Statut actuel: ${media.uploadStatus}`
      });
    }

    // 3. Mettre à jour uploadStatus = COMPLETED
    await prisma.media.update({
      where: { id: mediaId },
      data: { uploadStatus: 'COMPLETED' }
    });

    // 4. Mettre à jour Alert stats
    if (media.type === 'IMAGE') {
      await prisma.alert.update({
        where: { id: alertId },
        data: { imageCount: { increment: 1 } }
      });
    } else if (media.type === 'AUDIO') {
      await prisma.alert.update({
        where: { id: alertId },
        data: { hasAudio: true }
      });
    } else if (media.type === 'VIDEO') {
      await prisma.alert.update({
        where: { id: alertId },
        data: { hasVideo: true }
      });
    }

    // 5. Enqueue jobs asynchrones avec Bull (si Redis disponible)
    const jobsQueued = [];

    if (redisAvailable) {
      if (media.type === 'IMAGE') {
        // Job: Générer thumbnails (priorité haute)
        const job1 = await enqueueMediaJob('generate-thumbnails', { mediaId }, { priority: 5 });
        if (job1) jobsQueued.push('generate-thumbnails');

        // Job: AI Enhancement si DISP/DECD (priorité normale)
        const alert = media.alert;
        if (alert && ['DISP', 'DECD'].includes(alert.category)) {
          const job2 = await enqueueMediaJob('ai-enhancement', {
            mediaId,
            alertId,
            categoryCode: alert.category
          }, { priority: 10 });
          if (job2) jobsQueued.push('ai-enhancement');
        }
      } else if (media.type === 'AUDIO') {
        // Job: Transcription Whisper (priorité haute)
        const job1 = await enqueueMediaJob('transcribe-audio', { mediaId }, { priority: 5 });
        if (job1) jobsQueued.push('transcribe-audio');

        // Job: Waveform (priorité basse)
        const job2 = await enqueueMediaJob('generate-waveform', { mediaId }, { priority: 15 });
        if (job2) jobsQueued.push('generate-waveform');
      } else if (media.type === 'VIDEO') {
        // Job: Générer preview + thumbnail (priorité normale)
        const job1 = await enqueueMediaJob('generate-video-preview', { mediaId }, { priority: 10 });
        if (job1) jobsQueued.push('generate-video-preview');

        const job2 = await enqueueMediaJob('generate-video-thumbnail', { mediaId }, { priority: 10 });
        if (job2) jobsQueued.push('generate-video-thumbnail');
      }
    }

    const statusMessage = redisAvailable
      ? `Upload finalisé. Jobs enqueued: [${jobsQueued.join(', ')}]`
      : 'Upload finalisé (Redis non disponible - jobs de traitement désactivés)';

    console.log(`✅ [${mediaId}] ${statusMessage}`);

    res.json({
      success: true,
      mediaId: media.id,
      uploadStatus: 'COMPLETED',
      jobsQueued,
      redisAvailable,
      message: redisAvailable
        ? 'Upload finalisé. Les dérivés seront générés en arrière-plan.'
        : 'Upload finalisé. Note: Redis non disponible, les thumbnails et traitements ne seront pas générés automatiquement.',
      media: {
        id: media.id,
        type: media.type,
        position: media.position,
        url: media.url,
        size: media.size,
        checksum: media.checksum
      }
    });

  } catch (error) {
    console.error('Erreur lors de la finalisation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la finalisation'
    });
  }
};

/**
 * GET /api/alerts/:alertId/media
 * Liste tous les médias d'une alerte avec dérivés et transcriptions
 */
exports.getAlertMedia = async (req, res) => {
  const { alertId } = req.params;

  try {
    const media = await prisma.media.findMany({
      where: {
        alertId,
        uploadStatus: 'COMPLETED'
      },
      include: {
        derivatives: true,
        transcriptions: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { type: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({
      success: true,
      count: media.length,
      data: media
    });

  } catch (error) {
    console.error('Erreur lors de la récupération médias:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE /api/alerts/:alertId/media/:mediaId
 * Supprime un média et ses dérivés
 */
exports.deleteMedia = async (req, res) => {
  const { alertId, mediaId } = req.params;

  try {
    // 1. Récupérer le média
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { derivatives: true }
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Média introuvable'
      });
    }

    if (media.alertId !== alertId) {
      return res.status(400).json({
        success: false,
        error: 'Média ne correspond pas à l\'alerte'
      });
    }

    // 2. Supprimer fichiers du disque
    const mediaDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'alerts',
      alertId,
      'media',
      mediaId
    );

    try {
      await fs.rm(mediaDir, { recursive: true, force: true });
      console.log(`🗑️  [${mediaId}] Répertoire supprimé: ${mediaDir}`);
    } catch (fsError) {
      console.error('Erreur suppression fichiers:', fsError);
    }

    // 3. Supprimer enregistrements DB (cascade)
    await prisma.media.delete({
      where: { id: mediaId }
    });

    // 4. Mettre à jour Alert stats
    if (media.type === 'IMAGE') {
      await prisma.alert.update({
        where: { id: alertId },
        data: { imageCount: { decrement: 1 } }
      });
    } else if (media.type === 'AUDIO') {
      const remainingAudio = await prisma.media.count({
        where: { alertId, type: 'AUDIO' }
      });
      if (remainingAudio === 0) {
        await prisma.alert.update({
          where: { id: alertId },
          data: { hasAudio: false }
        });
      }
    } else if (media.type === 'VIDEO') {
      const remainingVideo = await prisma.media.count({
        where: { alertId, type: 'VIDEO' }
      });
      if (remainingVideo === 0) {
        await prisma.alert.update({
          where: { id: alertId },
          data: { hasVideo: false }
        });
      }
    }

    console.log(`✅ [${mediaId}] Média supprimé`);

    res.json({
      success: true,
      message: 'Média supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/media/:mediaId/transcription
 * Ajoute une correction humaine à une transcription audio
 */
exports.addTranscriptionCorrection = async (req, res) => {
  const { mediaId } = req.params;
  const { text, language, createdBy } = req.body;

  try {
    // 1. Vérifier que c'est un média audio
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { transcriptions: { orderBy: { version: 'desc' } } }
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Média introuvable'
      });
    }

    if (media.type !== 'AUDIO') {
      return res.status(400).json({
        success: false,
        error: 'Les transcriptions sont réservées aux médias audio'
      });
    }

    // 2. Désactiver toutes les transcriptions existantes
    await prisma.transcription.updateMany({
      where: { mediaId },
      data: { isActive: false }
    });

    // 3. Calculer nouvelle version
    const lastVersion = media.transcriptions[0]?.version || 0;
    const newVersion = lastVersion + 1;

    // 4. Créer nouvelle transcription
    const transcription = await prisma.transcription.create({
      data: {
        mediaId,
        text,
        language: language || 'fr',
        version: newVersion,
        source: 'HUMAN_CORRECTED',
        createdBy,
        isActive: true
      }
    });

    console.log(`✅ [${mediaId}] Transcription v${newVersion} ajoutée (correction humaine)`);

    res.json({
      success: true,
      transcription,
      message: `Transcription v${newVersion} activée`
    });

  } catch (error) {
    console.error('Erreur ajout transcription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/media/:mediaId/transcription/best
 * Récupère la meilleure transcription (priorité HUMAN > AUTO)
 */
exports.getBestTranscription = async (req, res) => {
  const { mediaId } = req.params;

  try {
    const transcription = await prisma.transcription.findFirst({
      where: {
        mediaId,
        isActive: true
      },
      orderBy: [
        { source: 'desc' }, // MANUAL > HUMAN_CORRECTED > AUTO
        { version: 'desc' }
      ]
    });

    if (!transcription) {
      return res.status(404).json({
        success: false,
        error: 'Aucune transcription disponible'
      });
    }

    res.json({
      success: true,
      transcription
    });

  } catch (error) {
    console.error('Erreur récupération transcription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
