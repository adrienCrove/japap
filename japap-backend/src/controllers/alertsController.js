const prisma = require('../config/prismaClient');
const { enrichAlertWithPriorityStatus, sortAlertsByPriority } = require('../utils/alertPriority');
const { enhancePortrait, shouldEnhanceImage } = require('../services/imageEnhancementService');
const fileUtils = require('../utils/fileUtils');
const path = require('path');

// POST /api/alerts
exports.createAlert = async (req, res) => {
  const { category, severity, description, location, status, mediaUrl, userId, title, source } = req.body;

  // Validation simple
  if (!category || !description || !location || !title) {
    return res.status(400).json({ error: 'Les champs category, title, description et location sont requis.' });
  }

  try {
    // 1. Générer le ref_alert_id
    const categoryCode = category.substring(0, 3).toUpperCase();
    const alertCount = await prisma.alert.count({ where: { category } });
    const ref_alert_id = `ALT/${categoryCode}-${(alertCount + 1).toString().padStart(3, '0')}`;
    
    // 2. Créer le displayTitle
    const displayTitle = `[${ref_alert_id}] ${title}`;

    // 3. Gérer l'ID de l'utilisateur
    let finalUserId = userId;
    if (!finalUserId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      finalUserId = defaultUser?.id || null;
    }

    const newAlert = await prisma.alert.create({
      data: {
        ref_alert_id,
        category,
        severity: severity || 'medium',
        title,
        displayTitle,
        description,
        location, // location est un objet JSON { address, coordinates }
        source: source || 'web',
        status: status || 'pending',
        mediaUrl: mediaUrl || '',
        userId: finalUserId,
      },
    });
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la création de l\'alerte.' });
  }
};

// POST /api/alerts/create-with-enhancement
// Crée une alerte avec amélioration d'image pour les catégories DISP et DECD
exports.createAlertWithEnhancement = async (req, res) => {
  const { category, severity, description, location, status, userId, title, source } = req.body;
  const imageFile = req.file; // Multer file

  // Validation
  if (!category || !description || !location || !title) {
    return res.status(400).json({
      success: false,
      error: 'Les champs category, title, description et location sont requis.'
    });
  }

  if (!imageFile) {
    return res.status(400).json({
      success: false,
      error: 'Une image est requise pour les alertes DISP et DECD.'
    });
  }

  try {
    console.log(`🎨 Creating alert with enhancement for category: ${category}`);

    // 1. Générer le ref_alert_id
    const categoryCode = category.substring(0, 3).toUpperCase();
    const alertCount = await prisma.alert.count({ where: { category } });
    const ref_alert_id = `ALT/${categoryCode}-${(alertCount + 1).toString().padStart(3, '0')}`;

    // 2. Créer le displayTitle
    const displayTitle = `[${ref_alert_id}] ${title}`;

    // 3. Gérer l'ID de l'utilisateur
    let finalUserId = userId;
    if (!finalUserId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      finalUserId = defaultUser?.id || null;
    }

    // 4. Sauvegarder l'image originale
    console.log(`📸 Saving original image...`);
    const originalFileInfo = await fileUtils.saveFile(
      imageFile.buffer,
      'alert',
      null, // alertId not yet created
      imageFile.originalname
    );

    const dimensions = await fileUtils.getImageDimensions(imageFile.buffer);

    // 5. Créer l'enregistrement de l'image originale
    const originalImage = await prisma.image.create({
      data: {
        filename: originalFileInfo.filename,
        originalName: originalFileInfo.originalName,
        path: originalFileInfo.path,
        url: originalFileInfo.path,
        size: originalFileInfo.size,
        mimeType: imageFile.mimetype,
        width: dimensions.width,
        height: dimensions.height,
        category: 'alert',
        storage: 'local',
        isEnhanced: false,
        userId: finalUserId,
      },
    });

    console.log(`✅ Original image saved: ${originalImage.id}`);

    // 6. Améliorer l'image si la catégorie le nécessite (DISP ou DECD)
    let enhancedImage = null;

    if (shouldEnhanceImage(category)) {
      console.log(`🎨 Category ${category} requires enhancement, starting...`);

      try {
        // Timeout de 10 secondes pour l'amélioration
        const enhancementPromise = enhancePortrait(originalImage.id, { categoryCode: category });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Enhancement timeout')), 10000)
        );

        const enhancementResult = await Promise.race([enhancementPromise, timeoutPromise]);

        if (enhancementResult.success) {
          console.log(`✅ Image enhanced successfully: ${enhancementResult.enhancedImageId}`);

          // Récupérer l'image améliorée
          enhancedImage = await prisma.image.findUnique({
            where: { id: enhancementResult.enhancedImageId }
          });
        } else {
          console.warn(`⚠️ Enhancement failed: ${enhancementResult.error}`);
        }
      } catch (enhancementError) {
        console.error(`❌ Enhancement error (will use original only):`, enhancementError.message);
        // Continue with original image only
      }
    } else {
      console.log(`ℹ️ Category ${category} does not require enhancement`);
    }

    // 7. Créer l'alerte
    const newAlert = await prisma.alert.create({
      data: {
        ref_alert_id,
        category,
        severity: severity || 'medium',
        title,
        displayTitle,
        description,
        location,
        source: source || 'app',
        status: status || 'pending',
        mediaUrl: enhancedImage ? enhancedImage.url : originalImage.url, // Use enhanced if available
        userId: finalUserId,
      },
    });

    console.log(`✅ Alert created: ${newAlert.id}`);

    // 8. Lier les images à l'alerte
    await prisma.image.update({
      where: { id: originalImage.id },
      data: { alertId: newAlert.id }
    });

    if (enhancedImage) {
      await prisma.image.update({
        where: { id: enhancedImage.id },
        data: { alertId: newAlert.id }
      });
    }

    // 9. Récupérer l'alerte avec toutes les images
    const alertWithImages = await prisma.alert.findUnique({
      where: { id: newAlert.id },
      include: {
        images: {
          orderBy: { createdAt: 'asc' }, // Original first
          select: {
            id: true,
            url: true,
            isEnhanced: true,
            originalImageId: true,
            width: true,
            height: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        }
      }
    });

    console.log(`🎉 Alert created with ${alertWithImages.images.length} image(s)`);

    res.status(201).json({
      success: true,
      data: alertWithImages,
      message: enhancedImage
        ? 'Alerte créée avec succès. Image améliorée disponible.'
        : 'Alerte créée avec succès.',
      enhancementStatus: enhancedImage ? 'completed' : 'skipped'
    });

  } catch (error) {
    console.error('❌ Error creating alert with enhancement:', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'alerte.'
    });
  }
};

// GET /api/alerts
exports.getAllAlerts = async (req, res) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 10,
            category,
            severity,
            status
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Construction des filtres
        const where = {};

        // Filtre de recherche
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { ref_alert_id: { contains: search, mode: 'insensitive' } },
                { displayTitle: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Filtres spécifiques
        if (category) where.category = category;
        if (severity) where.severity = severity;
        if (status) where.status = status;

        // Compter le total d'alertes avec les filtres
        const total = await prisma.alert.count({ where });

        // Récupérer les alertes avec pagination et filtres
        const alerts = await prisma.alert.findMany({
            where,
            include: {
                user: true, // Inclure les informations de l'utilisateur
                categoryAlert: true // Inclure la catégorie pour calculer priorityStatus
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limitNum
        });

        // Enrichir chaque alerte avec priorityStatus
        const enrichedAlerts = alerts.map(alert => enrichAlertWithPriorityStatus(alert));

        // Trier par priorité (active > expired > resolved)
        const sortedAlerts = sortAlertsByPriority(enrichedAlerts);

        const totalPages = Math.ceil(total / limitNum);

        // Format compatible avec le frontend
        const response = {
            success: true,
            data: {
                alerts: sortedAlerts,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        res.status(500).json({
            success: false,
            error: 'Une erreur est survenue lors de la récupération des alertes.'
        });
    }
}

// GET /api/alerts/:id
exports.getAlertById = async (req, res) => {
    try {
        const { id } = req.params;

        const alert = await prisma.alert.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
                    }
                },
                images: {
                    orderBy: { createdAt: 'asc' }, // Original first, then enhanced
                    select: {
                        id: true,
                        url: true,
                        isEnhanced: true,
                        originalImageId: true,
                        width: true,
                        height: true,
                        enhancementMetadata: true,
                    }
                }
            }
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alerte non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'alerte:', error);
        res.status(500).json({
            success: false,
            error: 'Une erreur est survenue lors de la récupération de l\'alerte.'
        });
    }
}

// PUT /api/alerts/:id
exports.updateAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            displayTitle,
            description,
            severity,
            status,
            location,
            mediaUrl,
            categorySpecificFields
        } = req.body;

        // Vérifier que l'alerte existe
        const existingAlert = await prisma.alert.findUnique({
            where: { id }
        });

        if (!existingAlert) {
            return res.status(404).json({
                success: false,
                error: 'Alerte non trouvée'
            });
        }

        // Préparer les données à mettre à jour
        const updateData = {};
        if (displayTitle !== undefined) updateData.displayTitle = displayTitle;
        if (description !== undefined) updateData.description = description;
        if (severity !== undefined) updateData.severity = severity;
        if (status !== undefined) updateData.status = status;
        if (location !== undefined) updateData.location = location;
        if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
        if (categorySpecificFields !== undefined) updateData.categorySpecificFields = categorySpecificFields;

        // Mettre à jour l'alerte
        const updatedAlert = await prisma.alert.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: updatedAlert,
            message: 'Alerte mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'alerte:', error);
        res.status(500).json({
            success: false,
            error: 'Une erreur est survenue lors de la mise à jour de l\'alerte.'
        });
    }
}

// PATCH /api/alerts/:id/share
// Marque une alerte comme partagée
exports.shareAlert = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que l'alerte existe
        const existingAlert = await prisma.alert.findUnique({
            where: { id }
        });

        if (!existingAlert) {
            return res.status(404).json({
                success: false,
                error: 'Alerte introuvable'
            });
        }

        // Mettre à jour l'alerte avec isShared = true et sharedAt = now()
        const updatedAlert = await prisma.alert.update({
            where: { id },
            data: {
                isShared: true,
                sharedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
                    }
                }
            }
        });

        console.log(`✅ Alert ${id} marked as shared`);

        res.status(200).json({
            success: true,
            data: updatedAlert,
            message: 'Alerte partagée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors du partage de l\'alerte:', error);
        res.status(500).json({
            success: false,
            error: 'Une erreur est survenue lors du partage de l\'alerte.'
        });
    }
}
