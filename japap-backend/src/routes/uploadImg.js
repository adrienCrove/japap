const express = require('express');
const multer = require('multer');
const axios = require('axios');
const https = require('https');
const FormData = require('form-data');
const router = express.Router();

// Agent HTTPS pour gérer les certificats auto-signés
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Désactive la vérification SSL pour les certificats auto-signés
});

// Configuration multer pour gérer les uploads en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite à 10MB
  }
});

/**
 * GET /api/upload/test
 * Endpoint de test pour vérifier que la route fonctionne
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload endpoint is working',
    config: {
      IMG_API_URL: process.env.IMG_API_URL ? 'configured' : 'missing',
      IMG_API_KEY: process.env.IMG_API_KEY ? 'configured' : 'missing',
    }
  });
});

/**
 * GET /api/upload/test-remote
 * Teste la connexion à l'API distante
 */
router.get('/test-remote', async (_req, res) => {
  const IMG_API_URL = process.env.IMG_API_URL;
  const IMG_API_KEY = process.env.IMG_API_KEY;

  if (!IMG_API_URL || !IMG_API_KEY) {
    return res.json({
      success: false,
      message: 'Configuration manquante',
      config: {
        IMG_API_URL: IMG_API_URL ? 'configured' : 'missing',
        IMG_API_KEY: IMG_API_KEY ? 'configured' : 'missing',
      }
    });
  }

  try {
    // Tester la connexion en listant les images
    const response = await axios.get(`${IMG_API_URL}/list`, {
      headers: {
        'x-api-key': IMG_API_KEY,
        'User-Agent': 'JAPAP-Backend/1.0',
      },
      httpsAgent: httpsAgent,
      timeout: 5000,
    });

    res.json({
      success: true,
      message: 'API distante accessible',
      url: IMG_API_URL,
      status: response.status,
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'API distante inaccessible',
      url: IMG_API_URL,
      error: error.message,
      code: error.code,
      status: error.response?.status,
    });
  }
});

/**
 * POST /api/upload
 * Upload une image vers l'API distante avec fallback local
 * Paramètres query supportés:
 * - category: "alert", "user", "admin", "broadcast", "temp" (default: "temp")
 * - entityId: ID de l'entité (alert ID, user ID, etc.)
 * - userId: ID du propriétaire
 * - uploadedBy: ID de qui a uploadé
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // Extraire les options depuis query params ou body
    const options = {
      category: req.query.category || req.body.category || 'temp',
      entityId: req.query.entityId || req.body.entityId || null,
      userId: req.query.userId || req.body.userId || null,
      uploadedBy: req.query.uploadedBy || req.body.uploadedBy || null,
    };

    const IMG_API_URL = process.env.IMG_API_URL;
    const IMG_API_KEY = process.env.IMG_API_KEY;

    // Vérifier la configuration de l'API distante
    if (!IMG_API_URL || !IMG_API_KEY) {
      console.warn('⚠️  Configuration API distante manquante, utilisation du stockage local');
      return await uploadLocal(file, res, options);
    }

    // Tenter l'upload vers l'API distante
    try {
      console.log(`📤 Upload vers API distante: ${IMG_API_URL}/upload`);

      const formData = new FormData();
      // IMPORTANT: Le serveur attend le champ 'image' (pas 'file')
      formData.append('image', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(`${IMG_API_URL}/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': IMG_API_KEY, // Header correct pour votre API
          'User-Agent': 'JAPAP-Backend/1.0',
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 secondes
      });

      // Vérifier la réponse
      if (!response.data || !response.data.url) {
        throw new Error('Réponse invalide de l\'API distante');
      }

      // Construire l'URL complète
      let imageUrl = response.data.url;
      if (!imageUrl.startsWith('http')) {
        // Si l'URL est relative, construire l'URL complète
        imageUrl = `${IMG_API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }

      console.log(`✅ Image uploadée vers API distante: ${imageUrl}`);

      return res.json({
        success: true,
        url: imageUrl,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        storage: 'remote',
      });

    } catch (remoteError) {
      console.error(`❌ Erreur API distante: ${remoteError.message}`);
      console.log('🔄 Fallback vers stockage local...');

      // Fallback vers stockage local
      return await uploadLocal(file, res, options);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload de l\'image'
    });
  }
});

/**
 * Fonction helper pour upload local avec organisation par répertoires
 * @param {Object} file - Fichier multer
 * @param {Object} res - Response Express
 * @param {Object} options - Options: { category, entityId, userId }
 */
async function uploadLocal(file, res, options = {}) {
  const fileUtils = require('../utils/fileUtils');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const { category = 'temp', entityId = null, userId = null, uploadedBy = null } = options;

    // Valider le type de fichier
    if (!fileUtils.isValidImageType(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Type de fichier non autorisé',
      });
    }

    // Valider la taille
    if (!fileUtils.isValidFileSize(file.size)) {
      return res.status(400).json({
        success: false,
        error: 'Fichier trop volumineux (max 10MB)',
      });
    }

    // Sauvegarder le fichier avec organisation par répertoires
    const fileInfo = await fileUtils.saveFile(
      file.buffer,
      category,
      entityId,
      file.originalname
    );

    // Obtenir les dimensions de l'image
    const dimensions = await fileUtils.getImageDimensions(file.buffer);

    // Enregistrer dans la base de données
    const imageRecord = await prisma.image.create({
      data: {
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        path: fileInfo.path,
        url: fileInfo.path, // URL relative
        size: fileInfo.size,
        mimeType: file.mimetype,
        width: dimensions.width,
        height: dimensions.height,
        category: category,
        storage: 'local',
        isPublic: true,
        ...(entityId && category === 'alert' && { alertId: entityId }),
        ...(userId && { userId: userId }),
        ...(uploadedBy && { uploadedBy: uploadedBy }),
      },
    });

    console.log(`✅ Image sauvegardée: ${fileInfo.path} (${(fileInfo.size / 1024).toFixed(2)} KB)`);

    await prisma.$disconnect();

    return res.json({
      success: true,
      id: imageRecord.id,
      url: fileInfo.path,
      filename: fileInfo.filename,
      originalName: fileInfo.originalName,
      size: fileInfo.size,
      mimetype: file.mimetype,
      dimensions: dimensions,
      storage: 'local',
      category: category,
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload local:', error);

    await prisma.$disconnect();

    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload',
    });
  }
}

module.exports = router;