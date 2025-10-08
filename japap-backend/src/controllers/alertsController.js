const prisma = require('../config/prismaClient');

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
                user: true // Inclure les informations de l'utilisateur
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limitNum
        });

        const totalPages = Math.ceil(total / limitNum);

        // Format compatible avec le frontend
        const response = {
            success: true,
            data: {
                alerts: alerts,
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
