const prisma = require('../config/prismaClient');

// POST /api/interests/seed - Seeder pour créer les intérêts prédéfinis
exports.seedInterests = async (req, res) => {
  try {
    const interests = [
      {
        code: 'nearby_alerts',
        label: 'Alertes de sécurité à proximité',
        description: 'Recevoir des notifications sur les incidents de sécurité dans votre zone'
      },
      {
        code: 'breaking_news',
        label: 'Actualités importantes dans ma ville',
        description: 'Être informé des événements majeurs et actualités locales'
      },
      {
        code: 'get_help',
        label: 'Demander de l\'aide aux autres',
        description: 'Utiliser la plateforme pour demander assistance à la communauté'
      },
      {
        code: 'past_incidents',
        label: 'Incidents de sécurité passés dans ma zone',
        description: 'Consulter l\'historique des incidents pour mieux connaître son quartier'
      },
      {
        code: 'location_monitoring',
        label: 'Surveillance de localisation (domicile, travail)',
        description: 'Surveiller les alertes autour de lieux spécifiques (maison, bureau)'
      },
      {
        code: 'other',
        label: 'Autre',
        description: 'Autres raisons d\'utiliser JAPAP'
      }
    ];

    const created = [];

    for (const interest of interests) {
      // Utiliser upsert pour éviter les doublons
      const result = await prisma.interest.upsert({
        where: { code: interest.code },
        update: {
          label: interest.label,
          description: interest.description
        },
        create: interest
      });
      created.push(result);
    }

    res.status(200).json({
      success: true,
      message: `${created.length} intérêts créés ou mis à jour`,
      data: created
    });

  } catch (error) {
    console.error('Error seeding interests:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création des intérêts',
      details: error.message
    });
  }
};

// GET /api/interests - Lister tous les intérêts
exports.getAllInterests = async (req, res) => {
  try {
    const interests = await prisma.interest.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        code: true,
        label: true,
        description: true
      }
    });

    res.json({
      success: true,
      data: interests
    });

  } catch (error) {
    console.error('Error fetching interests:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des intérêts',
      details: error.message
    });
  }
};
