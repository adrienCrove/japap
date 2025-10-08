/**
 * Contrôleur pour gérer les canaux de diffusion (BroadcastChannel)
 */

const prisma = require('../config/prismaClient');

/**
 * GET /api/broadcast-channels
 * Récupérer tous les canaux de diffusion
 */
exports.getAllChannels = async (req, res) => {
  try {
    const { platform, isActive } = req.query;

    const where = {};
    if (platform && platform !== 'all') {
      where.platform = platform;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const channels = await prisma.broadcastChannel.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Error fetching broadcast channels:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des canaux',
      details: error.message
    });
  }
};

/**
 * GET /api/broadcast-channels/:id
 * Récupérer un canal spécifique
 */
exports.getChannelById = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.broadcastChannel.findUnique({
      where: { id },
      include: {
        broadcasts: {
          take: 10,
          orderBy: { sentAt: 'desc' }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }

    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du canal',
      details: error.message
    });
  }
};

/**
 * POST /api/broadcast-channels
 * Créer un nouveau canal de diffusion
 */
exports.createChannel = async (req, res) => {
  try {
    const { name, platform, credentials, followerCount } = req.body;

    // Validation
    if (!name || !platform || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'Le nom, la plateforme et les credentials sont requis'
      });
    }

    const validPlatforms = ['whatsapp', 'telegram', 'instagram'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: `Plateforme invalide. Valeurs autorisées: ${validPlatforms.join(', ')}`
      });
    }

    // Valider les credentials selon la plateforme
    const validationResult = validateCredentials(platform, credentials);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error
      });
    }

    const channel = await prisma.broadcastChannel.create({
      data: {
        name,
        platform,
        credentials,
        followerCount: followerCount || null,
        isActive: true,
        broadcastCount: 0
      }
    });

    res.status(201).json({
      success: true,
      data: channel,
      message: 'Canal créé avec succès'
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du canal',
      details: error.message
    });
  }
};

/**
 * PUT /api/broadcast-channels/:id
 * Mettre à jour un canal de diffusion
 */
exports.updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, credentials, followerCount, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (credentials !== undefined) {
      // Re-valider les credentials
      const channel = await prisma.broadcastChannel.findUnique({ where: { id } });
      if (!channel) {
        return res.status(404).json({
          success: false,
          error: 'Canal non trouvé'
        });
      }

      const validationResult = validateCredentials(channel.platform, credentials);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: validationResult.error
        });
      }
      updateData.credentials = credentials;
    }
    if (followerCount !== undefined) updateData.followerCount = followerCount;
    if (isActive !== undefined) updateData.isActive = isActive;

    const channel = await prisma.broadcastChannel.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: channel,
      message: 'Canal mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating channel:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du canal',
      details: error.message
    });
  }
};

/**
 * DELETE /api/broadcast-channels/:id
 * Supprimer un canal de diffusion
 */
exports.deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.broadcastChannel.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Canal supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting channel:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du canal',
      details: error.message
    });
  }
};

/**
 * PATCH /api/broadcast-channels/:id/toggle
 * Activer/Désactiver un canal
 */
exports.toggleChannel = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.broadcastChannel.findUnique({
      where: { id }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }

    const updated = await prisma.broadcastChannel.update({
      where: { id },
      data: { isActive: !channel.isActive }
    });

    res.json({
      success: true,
      data: updated,
      message: `Canal ${updated.isActive ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('Error toggling channel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement d\'état du canal',
      details: error.message
    });
  }
};

/**
 * Valider les credentials selon la plateforme
 */
function validateCredentials(platform, credentials) {
  switch (platform) {
    case 'whatsapp':
      if (!credentials.channelId || !credentials.accessToken) {
        return {
          valid: false,
          error: 'WhatsApp nécessite channelId et accessToken'
        };
      }
      break;

    case 'telegram':
      if (!credentials.botToken || !credentials.channelUsername) {
        return {
          valid: false,
          error: 'Telegram nécessite botToken et channelUsername'
        };
      }
      break;

    case 'instagram':
      if (!credentials.username || !credentials.accessToken) {
        return {
          valid: false,
          error: 'Instagram nécessite username et accessToken'
        };
      }
      break;

    default:
      return {
        valid: false,
        error: 'Plateforme non supportée'
      };
  }

  return { valid: true };
}
