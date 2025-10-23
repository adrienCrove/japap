const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/news
 * Récupère la liste des articles avec pagination et filtres
 */
exports.getAllNews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      sourceName,
      priority,
      search,
      sortBy = 'publishedAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construction du filtre
    const where = {
      isActive: true
    };

    if (category) {
      where.OR = [
        { primaryCategory: category },
        { categories: { has: category } }
      ];
    }

    if (sourceName) {
      where.sourceName = sourceName;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Récupération des articles
    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: order
        },
        select: {
          id: true,
          title: true,
          summary: true,
          sourceUrl: true,
          sourceName: true,
          categories: true,
          primaryCategory: true,
          location: true,
          publishedAt: true,
          relevanceScore: true,
          priority: true,
          imageUrl: true,
          author: true,
          views: true,
          slug: true,
          createdAt: true
        }
      }),
      prisma.newsArticle.count({ where })
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[News] Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des actualités',
      error: error.message
    });
  }
};

/**
 * GET /api/news/:id
 * Récupère un article par ID
 */
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.newsArticle.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Incrémenter le compteur de vues
    await prisma.newsArticle.update({
      where: { id },
      data: {
        views: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('[News] Error fetching news by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message
    });
  }
};

/**
 * GET /api/news/slug/:slug
 * Récupère un article par slug
 */
exports.getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await prisma.newsArticle.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Incrémenter le compteur de vues
    await prisma.newsArticle.update({
      where: { id: article.id },
      data: {
        views: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('[News] Error fetching news by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message
    });
  }
};

/**
 * GET /api/news/category/:category
 * Récupère les articles d'une catégorie
 */
exports.getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      isActive: true,
      OR: [
        { primaryCategory: category },
        { categories: { has: category } }
      ]
    };

    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        skip,
        take,
        orderBy: {
          publishedAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          summary: true,
          sourceUrl: true,
          sourceName: true,
          categories: true,
          primaryCategory: true,
          publishedAt: true,
          relevanceScore: true,
          priority: true,
          imageUrl: true,
          slug: true
        }
      }),
      prisma.newsArticle.count({ where })
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[News] Error fetching news by category:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des actualités',
      error: error.message
    });
  }
};

/**
 * GET /api/news/related/:alertId
 * Récupère les articles liés à une alerte
 */
exports.getRelatedNews = async (req, res) => {
  try {
    const { alertId } = req.params;

    // Récupérer l'alerte pour obtenir sa catégorie
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        categoryAlert: true
      }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      });
    }

    // Rechercher des articles avec ID d'alerte correspondant
    let articles = await prisma.newsArticle.findMany({
      where: {
        isActive: true,
        relatedAlertIds: {
          has: alertId
        }
      },
      orderBy: {
        relevanceScore: 'desc'
      },
      take: 10
    });

    // Si aucun article directement lié, chercher par catégorie
    if (articles.length === 0 && alert.categoryAlert) {
      const categoryName = alert.categoryAlert.name.toLowerCase();

      articles = await prisma.newsArticle.findMany({
        where: {
          isActive: true,
          OR: [
            { categories: { hasSome: [categoryName] } },
            { primaryCategory: categoryName }
          ],
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
          }
        },
        orderBy: {
          relevanceScore: 'desc'
        },
        take: 10
      });
    }

    res.json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('[News] Error fetching related news:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des actualités liées',
      error: error.message
    });
  }
};

/**
 * GET /api/news/trending
 * Récupère les articles tendances (haute pertinence + vues récentes)
 */
exports.getTrendingNews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await prisma.newsArticle.findMany({
      where: {
        isActive: true,
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
        }
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { views: 'desc' }
      ],
      take: parseInt(limit),
      select: {
        id: true,
        title: true,
        summary: true,
        sourceUrl: true,
        sourceName: true,
        categories: true,
        publishedAt: true,
        relevanceScore: true,
        priority: true,
        imageUrl: true,
        views: true,
        slug: true
      }
    });

    res.json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('[News] Error fetching trending news:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des actualités tendances',
      error: error.message
    });
  }
};

/**
 * GET /api/news/sources
 * Récupère la liste des sources disponibles
 */
exports.getSources = async (req, res) => {
  try {
    const sources = await prisma.newsSource.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: sources
    });

  } catch (error) {
    console.error('[News] Error fetching sources:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sources',
      error: error.message
    });
  }
};

/**
 * POST /api/news (Admin only)
 * Crée un nouvel article manuellement
 */
exports.createNews = async (req, res) => {
  try {
    const articleData = req.body;

    const article = await prisma.newsArticle.create({
      data: articleData
    });

    res.status(201).json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('[News] Error creating news:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'article',
      error: error.message
    });
  }
};

/**
 * PUT /api/news/:id (Admin only)
 * Met à jour un article
 */
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const article = await prisma.newsArticle.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('[News] Error updating news:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'article',
      error: error.message
    });
  }
};

/**
 * DELETE /api/news/:id (Admin only)
 * Supprime un article (soft delete)
 */
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.newsArticle.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });

  } catch (error) {
    console.error('[News] Error deleting news:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'article',
      error: error.message
    });
  }
};

/**
 * GET /api/news/stats
 * Statistiques des articles
 */
exports.getNewsStats = async (req, res) => {
  try {
    const [total, byCategory, bySources, recent] = await Promise.all([
      // Total d'articles actifs
      prisma.newsArticle.count({
        where: { isActive: true }
      }),

      // Par catégorie
      prisma.newsArticle.groupBy({
        by: ['primaryCategory'],
        where: { isActive: true },
        _count: true
      }),

      // Par source
      prisma.newsArticle.groupBy({
        by: ['sourceName'],
        where: { isActive: true },
        _count: true
      }),

      // Articles des dernières 24h
      prisma.newsArticle.count({
        where: {
          isActive: true,
          scrapedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byCategory,
        bySources,
        recent24h: recent
      }
    });

  } catch (error) {
    console.error('[News] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
