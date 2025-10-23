/**
 * Routes pour le workflow d'upload à 3 phases
 * Compatible avec l'app mobile JAPAP
 */

const express = require('express');
const multer = require('multer');
const ExternalStorageAdapter = require('../services/externalStorageAdapter');
const router = express.Router();

// Configuration Multer pour upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Initialiser l'adaptateur de stockage externe
const IMG_API_URL = process.env.IMG_API_URL;
const IMG_API_KEY = process.env.IMG_API_KEY;

if (!IMG_API_URL || !IMG_API_KEY) {
  console.warn('⚠️  IMG_API_URL ou IMG_API_KEY non configurés. Le système d\'upload externe ne fonctionnera pas.');
}

const storageAdapter = new ExternalStorageAdapter(IMG_API_URL, IMG_API_KEY);

/**
 * GET /api/media-upload/test
 * Teste la configuration et la connexion au serveur externe
 */
router.get('/test', async (req, res) => {
  try {
    const connectionTest = await storageAdapter.testConnection();

    res.json({
      success: true,
      config: {
        IMG_API_URL: IMG_API_URL ? 'configured' : 'missing',
        IMG_API_KEY: IMG_API_KEY ? 'configured' : 'missing',
      },
      externalServer: connectionTest,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      config: {
        IMG_API_URL: IMG_API_URL ? 'configured' : 'missing',
        IMG_API_KEY: IMG_API_KEY ? 'configured' : 'missing',
      },
    });
  }
});

/**
 * POST /api/media-upload/initiate
 * Phase 1: Initier l'upload
 *
 * Body: {
 *   alertId: string,
 *   mediaType: 'IMAGE' | 'AUDIO' | 'VIDEO',
 *   fileSize: number,
 *   checksum: string,
 *   position?: number (1-3 pour images)
 * }
 *
 * Response: {
 *   success: true,
 *   mediaId: string,
 *   uploadToken: string (JWT 5min),
 *   expiresAt: number (timestamp)
 * }
 */
router.post('/initiate', async (req, res) => {
  try {
    const { alertId, mediaType, fileSize, checksum, position } = req.body;

    // Validation des paramètres
    if (!alertId || !mediaType || !fileSize) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres manquants: alertId, mediaType, fileSize requis',
      });
    }

    // Générer un checksum par défaut si non fourni
    const finalChecksum = checksum || `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initier l'upload via l'adaptateur
    const result = await storageAdapter.initiateUpload(
      alertId,
      mediaType,
      fileSize,
      finalChecksum,
      position || null
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Erreur /initiate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'initiation de l\'upload',
    });
  }
});

/**
 * PUT /api/media-upload/presigned/:mediaId
 * Phase 2: Upload du fichier
 *
 * Headers: {
 *   Authorization: Bearer <uploadToken>
 * }
 *
 * Body: FormData with 'file' field
 *
 * Response: {
 *   success: true,
 *   mediaId: string,
 *   url: string,
 *   filename: string,
 *   size: number
 * }
 */
router.put('/presigned/:mediaId', upload.single('file'), async (req, res) => {
  try {
    const { mediaId } = req.params;
    const file = req.file;

    // Vérifier le fichier
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni',
      });
    }

    // Extraire le token JWT du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant',
      });
    }

    const uploadToken = authHeader.substring(7); // Enlever "Bearer "

    // Upload via l'adaptateur
    const result = await storageAdapter.uploadFile(
      mediaId,
      uploadToken,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Erreur /presigned:', error);

    if (error.message.includes('Token')) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload du fichier',
    });
  }
});

/**
 * POST /api/media-upload/complete/:mediaId
 * Phase 3: Finaliser l'upload
 *
 * Headers: {
 *   Authorization: Bearer <uploadToken>
 * }
 *
 * Response: {
 *   success: true,
 *   media: { ... }
 * }
 */
router.post('/complete/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;

    // Extraire le token JWT du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant',
      });
    }

    const uploadToken = authHeader.substring(7); // Enlever "Bearer "

    // Finaliser via l'adaptateur
    const result = await storageAdapter.completeUpload(mediaId, uploadToken);

    res.json(result);
  } catch (error) {
    console.error('❌ Erreur /complete:', error);

    if (error.message.includes('Token')) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la finalisation de l\'upload',
    });
  }
});

/**
 * POST /api/media-upload/upload-complete
 * Upload complet en une seule requête (pour tests ou usage simplifié)
 *
 * Body: FormData with:
 *   - file: fichier
 *   - alertId: string
 *   - mediaType: 'IMAGE' | 'AUDIO' | 'VIDEO'
 *   - position?: number (1-3 pour images)
 *
 * Response: {
 *   success: true,
 *   media: { ... }
 * }
 */
router.post('/upload-complete', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { alertId, mediaType, position } = req.body;

    // Validation
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni',
      });
    }

    if (!alertId || !mediaType) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres manquants: alertId et mediaType requis',
      });
    }

    // Upload complet via l'adaptateur
    const media = await storageAdapter.uploadComplete(
      alertId,
      file.buffer,
      file.originalname,
      file.mimetype,
      mediaType,
      position ? parseInt(position) : null
    );

    res.status(201).json({
      success: true,
      media: media,
    });
  } catch (error) {
    console.error('❌ Erreur /upload-complete:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload',
    });
  }
});

module.exports = router;
