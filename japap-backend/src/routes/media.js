/**
 * Routes Media - Gestion unifiée des médias (images, audio, vidéo)
 */

const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { uploadImage, uploadAudio, uploadVideo, handleMulterError } = require('../middleware/uploadMiddleware');

// ============ WORKFLOW UPLOAD ============

/**
 * POST /api/alerts/:alertId/media/initiate
 * Étape 1: Réserver un slot pour upload
 * Body: { type, position?, filename, mimeType, size, checksum?, capturedAt?, metadata? }
 */
router.post('/alerts/:alertId/media/initiate', mediaController.initiateMediaUpload);

/**
 * PUT /api/uploads/presigned/:mediaId
 * Étape 2: Upload du fichier binaire
 * Headers: Authorization (Bearer token), X-Checksum (sha256:...)
 * Body: fichier binaire (multipart/form-data)
 */
router.put(
  '/uploads/presigned/:mediaId',
  (req, res, next) => {
    // Middleware dynamique selon type de média
    // On récupère le type depuis le token JWT pour choisir le bon middleware
    const uploadToken = req.headers.authorization?.replace('Bearer ', '');

    if (!uploadToken) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'upload manquant'
      });
    }

    // Décoder le token pour connaître le type
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(uploadToken, JWT_SECRET);

      // Choisir le middleware selon le type
      let uploadMiddleware;
      if (decoded.type === 'IMAGE') {
        uploadMiddleware = uploadImage;
      } else if (decoded.type === 'AUDIO') {
        uploadMiddleware = uploadAudio;
      } else if (decoded.type === 'VIDEO') {
        uploadMiddleware = uploadVideo;
      } else {
        return res.status(400).json({
          success: false,
          error: `Type de média inconnu: ${decoded.type}`
        });
      }

      // Appliquer le middleware
      uploadMiddleware(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }
  },
  mediaController.uploadMediaFile
);

/**
 * POST /api/alerts/:alertId/media/:mediaId/complete
 * Étape 3: Finaliser l'upload et déclencher jobs asynchrones
 */
router.post('/alerts/:alertId/media/:mediaId/complete', mediaController.completeMediaUpload);

// ============ GESTION MÉDIAS ============

/**
 * GET /api/alerts/:alertId/media
 * Liste tous les médias d'une alerte avec dérivés et transcriptions
 */
router.get('/alerts/:alertId/media', mediaController.getAlertMedia);

/**
 * DELETE /api/alerts/:alertId/media/:mediaId
 * Supprime un média et ses fichiers
 */
router.delete('/alerts/:alertId/media/:mediaId', mediaController.deleteMedia);

// ============ TRANSCRIPTIONS ============

/**
 * POST /api/media/:mediaId/transcription
 * Ajoute une correction humaine à une transcription
 * Body: { text, language?, createdBy? }
 */
router.post('/media/:mediaId/transcription', mediaController.addTranscriptionCorrection);

/**
 * GET /api/media/:mediaId/transcription/best
 * Récupère la meilleure transcription (priorité HUMAN > AUTO)
 */
router.get('/media/:mediaId/transcription/best', mediaController.getBestTranscription);

module.exports = router;
