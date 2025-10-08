const prisma = require('../config/prismaClient');

// GET /api/social-links - Récupérer toutes les sources surveillées
exports.getAllSocialLinks = async (req, res) => {
  try {
    const { sourceType } = req.query;

    const where = {};
    if (sourceType && sourceType !== 'all') {
      where.sourceType = sourceType;
    }

    const sources = await prisma.monitoredSource.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Error fetching monitored sources:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des sources',
      details: error.message
    });
  }
};

// POST /api/social-links - Créer une nouvelle source
exports.createSocialLink = async (req, res) => {
  try {
    const { name, url, platform, sourceType, scrapingConfig } = req.body;

    // Validation
    if (!name || !url || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Le nom, l\'URL et la plateforme sont requis'
      });
    }

    // Validation du type de source
    const validSourceTypes = ['social', 'website', 'rss', 'api'];
    if (sourceType && !validSourceTypes.includes(sourceType)) {
      return res.status(400).json({
        success: false,
        error: `Type de source invalide. Valeurs autorisées: ${validSourceTypes.join(', ')}`
      });
    }

    const source = await prisma.monitoredSource.create({
      data: {
        name,
        url,
        platform,
        sourceType: sourceType || 'social',
        scrapingConfig: scrapingConfig || null,
        isActive: true,
        contentCount: 0
      }
    });

    res.status(201).json({
      success: true,
      data: source,
      message: 'Source créée avec succès'
    });
  } catch (error) {
    console.error('Error creating monitored source:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la source',
      details: error.message
    });
  }
};

// PUT /api/social-links/:id - Mettre à jour une source
exports.updateSocialLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, platform, sourceType, scrapingConfig, isActive } = req.body;

    const source = await prisma.monitoredSource.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(platform && { platform }),
        ...(sourceType && { sourceType }),
        ...(scrapingConfig !== undefined && { scrapingConfig }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      data: source,
      message: 'Source mise à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating monitored source:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la source',
      details: error.message
    });
  }
};

// DELETE /api/social-links/:id - Supprimer une source
exports.deleteSocialLink = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.monitoredSource.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Source supprimée avec succès'
    });
  } catch (error) {
    console.error('Error deleting monitored source:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la source',
      details: error.message
    });
  }
};
