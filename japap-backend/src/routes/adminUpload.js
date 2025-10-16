/**
 * Routes d'upload pour l'administration
 * Nécessite authentification et autorisation admin
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Configuration multer pour gérer les uploads en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite à 10MB
  },
  fileFilter: (req, file, cb) => {
    // Validation des types de fichiers
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  },
});

/**
 * Middleware d'authentification (à implémenter selon votre système d'auth)
 * Pour l'instant, on vérifie juste la présence d'un token
 */
function authMiddleware(req, res, next) {
  // TODO: Implémenter la vérification JWT
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise',
    });
  }

  // TODO: Vérifier le token et extraire les infos utilisateur
  // req.user = decodedToken.user;

  next();
}

/**
 * Middleware de vérification du rôle admin
 */
function adminMiddleware(req, res, next) {
  // TODO: Vérifier que req.user.role === 'admin'
  // if (req.user?.role !== 'admin') {
  //   return res.status(403).json({
  //     success: false,
  //     error: 'Accès réservé aux administrateurs',
  //   });
  // }

  next();
}

/**
 * POST /api/admin/upload
 * Upload une image depuis l'admin
 * Body params:
 * - file: Fichier image (multipart/form-data)
 * - category: "admin", "alert", "broadcast", etc.
 * - entityId: ID de l'entité (optionnel)
 */
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier fourni',
        });
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const fileUtils = require('../utils/fileUtils');

      // Options d'upload
      const category = req.body.category || 'admin';
      const entityId = req.body.entityId || null;
      const userId = req.body.userId || null;
      const uploadedBy = req.user?.id || null; // ID de l'admin qui upload

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

      // Sauvegarder le fichier
      const fileInfo = await fileUtils.saveFile(
        file.buffer,
        category,
        entityId,
        file.originalname
      );

      // Obtenir les dimensions
      const dimensions = await fileUtils.getImageDimensions(file.buffer);

      // Enregistrer dans la base de données
      const imageRecord = await prisma.image.create({
        data: {
          filename: fileInfo.filename,
          originalName: fileInfo.originalName,
          path: fileInfo.path,
          url: fileInfo.path,
          size: fileInfo.size,
          mimeType: file.mimetype,
          width: dimensions.width,
          height: dimensions.height,
          category: category,
          storage: 'local',
          isPublic: req.body.isPublic === 'true' || req.body.isPublic === true,
          ...(entityId && category === 'alert' && { alertId: entityId }),
          ...(userId && { userId: userId }),
          ...(uploadedBy && { uploadedBy: uploadedBy }),
        },
      });

      console.log(`✅ [ADMIN] Image uploadée: ${fileInfo.path} (${(fileInfo.size / 1024).toFixed(2)} KB)`);

      await prisma.$disconnect();

      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        image: imageRecord,
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload admin:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'upload',
      });
    }
  }
);

/**
 * POST /api/admin/upload/multiple
 * Upload multiple images depuis l'admin
 */
router.post(
  '/multiple',
  authMiddleware,
  adminMiddleware,
  upload.array('files', 10), // Max 10 fichiers
  async (req, res) => {
    try {
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier fourni',
        });
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const fileUtils = require('../utils/fileUtils');

      const category = req.body.category || 'admin';
      const entityId = req.body.entityId || null;
      const userId = req.body.userId || null;
      const uploadedBy = req.user?.id || null;

      const uploadedImages = [];
      const errors = [];

      // Uploader chaque fichier
      for (const file of files) {
        try {
          // Valider
          if (!fileUtils.isValidImageType(file.mimetype)) {
            errors.push({
              filename: file.originalname,
              error: 'Type de fichier non autorisé',
            });
            continue;
          }

          if (!fileUtils.isValidFileSize(file.size)) {
            errors.push({
              filename: file.originalname,
              error: 'Fichier trop volumineux',
            });
            continue;
          }

          // Sauvegarder
          const fileInfo = await fileUtils.saveFile(
            file.buffer,
            category,
            entityId,
            file.originalname
          );

          const dimensions = await fileUtils.getImageDimensions(file.buffer);

          // Enregistrer en DB
          const imageRecord = await prisma.image.create({
            data: {
              filename: fileInfo.filename,
              originalName: fileInfo.originalName,
              path: fileInfo.path,
              url: fileInfo.path,
              size: fileInfo.size,
              mimeType: file.mimetype,
              width: dimensions.width,
              height: dimensions.height,
              category: category,
              storage: 'local',
              isPublic: req.body.isPublic === 'true' || req.body.isPublic === true,
              ...(entityId && category === 'alert' && { alertId: entityId }),
              ...(userId && { userId: userId }),
              ...(uploadedBy && { uploadedBy: uploadedBy }),
            },
          });

          uploadedImages.push(imageRecord);
        } catch (fileError) {
          errors.push({
            filename: file.originalname,
            error: fileError.message,
          });
        }
      }

      await prisma.$disconnect();

      console.log(`✅ [ADMIN] ${uploadedImages.length} image(s) uploadée(s)`);

      res.json({
        success: true,
        message: `${uploadedImages.length} image(s) uploadée(s) avec succès`,
        uploaded: uploadedImages.length,
        images: uploadedImages,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload multiple:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'upload',
      });
    }
  }
);

// ============ ROUTES DE GESTION DES IMAGES ============

/**
 * GET /api/admin/images
 * Liste toutes les images avec pagination
 */
router.get('/images', authMiddleware, adminMiddleware, async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const where = category ? { category } : {};
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: parseInt(limit),
        include: {
          alert: {
            select: {
              id: true,
              title: true,
              ref_alert_id: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.image.count({ where }),
    ]);

    await prisma.$disconnect();

    res.json({
      success: true,
      count: images.length,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      images: images,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/images/alert/:alertId
 * Récupérer les images d'une alerte
 */
router.get(
  '/images/alert/:alertId',
  authMiddleware,
  adminMiddleware,
  imageController.getAlertImages
);

/**
 * GET /api/admin/images/stats
 * Statistiques des images
 */
router.get(
  '/images/stats',
  authMiddleware,
  adminMiddleware,
  imageController.getImageStats
);

/**
 * GET /api/admin/images/:imageId
 * Détails d'une image
 */
router.get(
  '/images/:imageId',
  authMiddleware,
  adminMiddleware,
  imageController.getImageById
);

/**
 * PATCH /api/admin/images/:imageId
 * Mettre à jour une image
 */
router.patch(
  '/images/:imageId',
  authMiddleware,
  adminMiddleware,
  imageController.updateImage
);

/**
 * DELETE /api/admin/images/:imageId
 * Supprimer une image
 */
router.delete(
  '/images/:imageId',
  authMiddleware,
  adminMiddleware,
  imageController.deleteImage
);

/**
 * DELETE /api/admin/images/alert/:alertId
 * Supprimer toutes les images d'une alerte
 */
router.delete(
  '/images/alert/:alertId',
  authMiddleware,
  adminMiddleware,
  imageController.deleteAlertImages
);

module.exports = router;
