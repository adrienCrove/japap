const prisma = require('../config/prismaClient');

/**
 * GET /api/category-alerts
 * Récupérer toutes les catégories d'alertes actives
 */
exports.getAllCategoryAlerts = async (req, res) => {
  try {
    const { priority, isActive = 'true' } = req.query;

    const where = {};

    // Filtre par priorité
    if (priority) {
      where.priority = priority;
    }

    // Filtre par statut actif
    if (isActive === 'true') {
      where.isActive = true;
    }

    const categories = await prisma.categoryAlert.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { priority: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching category alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération des catégories.'
    });
  }
};

/**
 * GET /api/category-alerts/:id
 * Récupérer une catégorie par ID
 */
exports.getCategoryAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.categoryAlert.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            alerts: true,
            categoryAlertInterests: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Catégorie non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category alert:', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération de la catégorie.'
    });
  }
};

/**
 * GET /api/category-alerts/code/:code
 * Récupérer une catégorie par code (ex: "MEDC", "FIRV")
 */
exports.getCategoryAlertByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const category = await prisma.categoryAlert.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: {
            alerts: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Catégorie avec le code "${code}" non trouvée`
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category alert by code:', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération de la catégorie.'
    });
  }
};

/**
 * GET /api/category-alerts/priority/:priority
 * Récupérer les catégories par priorité (critical, high, medium, low)
 */
exports.getCategoryAlertsByPriority = async (req, res) => {
  try {
    const { priority } = req.params;

    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Priorité invalide. Valeurs acceptées: critical, high, medium, low'
      });
    }

    const categories = await prisma.categoryAlert.findMany({
      where: {
        priority,
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories by priority:', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération des catégories.'
    });
  }
};

/**
 * GET /api/category-alerts/search
 * Rechercher des catégories par keywords dans le message
 */
exports.searchCategoryByKeywords = async (req, res) => {
  try {
    const { message } = req.query;

    if (!message || message.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Le message doit contenir au moins 3 caractères'
      });
    }

    const messageLower = message.toLowerCase();

    // Récupérer toutes les catégories actives
    const categories = await prisma.categoryAlert.findMany({
      where: { isActive: true }
    });

    // Scorer chaque catégorie selon les keywords matchés
    const scoredCategories = categories.map(category => {
      const keywords = Array.isArray(category.keywords) ? category.keywords : [];
      const matchCount = keywords.filter(keyword =>
        messageLower.includes(keyword.toLowerCase())
      ).length;

      return {
        ...category,
        matchScore: matchCount,
        matchedKeywords: keywords.filter(keyword =>
          messageLower.includes(keyword.toLowerCase())
        )
      };
    }).filter(cat => cat.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    if (scoredCategories.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Aucune catégorie correspondante trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: scoredCategories,
      bestMatch: scoredCategories[0]
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la recherche.'
    });
  }
};

/**
 * GET /api/category-alerts/stats
 * Statistiques sur les catégories (nombre d'alertes par catégorie)
 */
exports.getCategoryStats = async (req, res) => {
  try {
    const stats = await prisma.categoryAlert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        icon: true,
        color: true,
        priority: true,
        _count: {
          select: {
            alerts: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Calculer totaux par priorité
    const priorityStats = stats.reduce((acc, cat) => {
      if (!acc[cat.priority]) {
        acc[cat.priority] = {
          count: 0,
          alerts: 0
        };
      }
      acc[cat.priority].count++;
      acc[cat.priority].alerts += cat._count.alerts;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        categories: stats,
        byPriority: priorityStats,
        totalCategories: stats.length,
        totalAlerts: stats.reduce((sum, cat) => sum + cat._count.alerts, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération des statistiques.'
    });
  }
};
