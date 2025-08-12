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
        const alerts = await prisma.alert.findMany({
            include: {
                user: true // Inclure les informations de l'utilisateur
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
        
        // Format compatible avec le frontend
        const response = {
            success: true,
            data: {
                alerts: alerts,
                pagination: {
                    total: alerts.length,
                    page: 1,
                    limit: alerts.length,
                    totalPages: 1
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
