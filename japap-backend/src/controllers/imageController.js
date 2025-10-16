/**
 * Contrôleur pour la gestion des images
 * CRUD et logique métier
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fileUtils = require('../utils/fileUtils');

/**
 * Récupérer toutes les images d'une alerte
 * GET /api/images/alert/:alertId
 */
async function getAlertImages(req, res) {
  try {
    const { alertId } = req.params;

    const images = await prisma.image.findMany({
      where: {
        alertId: alertId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: images.length,
      images: images,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Récupérer toutes les images d'un utilisateur
 * GET /api/images/user/:userId
 */
async function getUserImages(req, res) {
  try {
    const { userId } = req.params;

    const images = await prisma.image.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      count: images.length,
      images: images,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Récupérer les images par catégorie
 * GET /api/images/category/:category
 */
async function getImagesByCategory(req, res) {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: {
          category: category,
        },
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
        },
      }),
      prisma.image.count({
        where: {
          category: category,
        },
      }),
    ]);

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
}

/**
 * Récupérer une image par ID
 * GET /api/images/:imageId
 */
async function getImageById(req, res) {
  try {
    const { imageId } = req.params;

    const image = await prisma.image.findUnique({
      where: {
        id: imageId,
      },
      include: {
        alert: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image non trouvée',
      });
    }

    res.json({
      success: true,
      image: image,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Supprimer une image
 * DELETE /api/images/:imageId
 */
async function deleteImage(req, res) {
  try {
    const { imageId } = req.params;

    // Récupérer l'image
    const image = await prisma.image.findUnique({
      where: {
        id: imageId,
      },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image non trouvée',
      });
    }

    // Supprimer le fichier physique si stockage local
    if (image.storage === 'local') {
      await fileUtils.deleteFile(image.path);
    }

    // Supprimer de la base de données
    await prisma.image.delete({
      where: {
        id: imageId,
      },
    });

    res.json({
      success: true,
      message: 'Image supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Supprimer toutes les images d'une alerte
 * DELETE /api/images/alert/:alertId
 */
async function deleteAlertImages(req, res) {
  try {
    const { alertId } = req.params;

    // Récupérer toutes les images de l'alerte
    const images = await prisma.image.findMany({
      where: {
        alertId: alertId,
      },
    });

    // Supprimer les fichiers physiques
    for (const image of images) {
      if (image.storage === 'local') {
        await fileUtils.deleteFile(image.path);
      }
    }

    // Supprimer de la base de données
    const result = await prisma.image.deleteMany({
      where: {
        alertId: alertId,
      },
    });

    // Supprimer le répertoire entier
    await fileUtils.deleteDirectory('alert', alertId);

    res.json({
      success: true,
      message: `${result.count} image(s) supprimée(s) avec succès`,
      count: result.count,
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des images:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Mettre à jour les métadonnées d'une image
 * PATCH /api/images/:imageId
 */
async function updateImage(req, res) {
  try {
    const { imageId } = req.params;
    const { isPublic, category, metadata } = req.body;

    const updateData = {};

    if (typeof isPublic !== 'undefined') {
      updateData.isPublic = isPublic;
    }

    if (category) {
      updateData.category = category;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const updatedImage = await prisma.image.update({
      where: {
        id: imageId,
      },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Image mise à jour avec succès',
      image: updatedImage,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Récupérer les statistiques des images
 * GET /api/images/stats
 */
async function getImageStats(req, res) {
  try {
    const [totalImages, byCategory, byStorage, recentImages] = await Promise.all([
      // Total des images
      prisma.image.count(),

      // Par catégorie
      prisma.image.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
      }),

      // Par type de stockage
      prisma.image.groupBy({
        by: ['storage'],
        _count: {
          id: true,
        },
      }),

      // Images récentes (dernières 24h)
      prisma.image.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        total: totalImages,
        byCategory: byCategory.map(item => ({
          category: item.category || 'uncategorized',
          count: item._count.id,
        })),
        byStorage: byStorage.map(item => ({
          storage: item.storage,
          count: item._count.id,
        })),
        recent24h: recentImages,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  getAlertImages,
  getUserImages,
  getImagesByCategory,
  getImageById,
  deleteImage,
  deleteAlertImages,
  updateImage,
  getImageStats,
};
