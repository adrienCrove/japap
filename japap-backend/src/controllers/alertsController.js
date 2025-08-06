const prisma = require('../config/prismaClient');

// POST /api/alerts
exports.createAlert = async (req, res) => {
  const { category, severity, description, location, status } = req.body;

  // Validation simple
  if (!category || !description || !location) {
    return res.status(400).json({ error: 'Les champs category, description et location sont requis.' });
  }

  try {
    const newAlert = await prisma.alert.create({
      data: {
        category,
        severity: severity || 'medium',
        description,
        location, // location est un objet JSON { address, coordinates }
        status: status || 'pending',
        // expiresAt, mediaUrl, etc. peuvent être ajoutés ici
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
            orderBy: {
                createdAt: 'desc',
            }
        });
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des alertes.' });
    }
}
