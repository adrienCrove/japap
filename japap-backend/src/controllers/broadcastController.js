/**
 * Contrôleur pour gérer la diffusion d'alertes sur les canaux
 */

const prisma = require('../config/prismaClient');

/**
 * POST /api/broadcast/alert/:alertId
 * Diffuser une alerte sur les canaux sélectionnés
 */
exports.broadcastAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { channelIds } = req.body; // Array des IDs de canaux

    // Validation
    if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez sélectionner au moins un canal de diffusion'
      });
    }

    // Récupérer l'alerte
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: {
            phone: true,
            name: true
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

    // Récupérer les canaux
    const channels = await prisma.broadcastChannel.findMany({
      where: {
        id: { in: channelIds },
        isActive: true
      }
    });

    if (channels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun canal actif trouvé'
      });
    }

    // Formater le message pour chaque canal
    const results = [];
    for (const channel of channels) {
      try {
        const message = formatAlertMessage(alert, channel.platform);

        // Simuler l'envoi (à remplacer par vrais appels API)
        const broadcastResult = await sendToChannel(channel, message, alert);

        // Logger la diffusion
        await prisma.broadcastLog.create({
          data: {
            channelId: channel.id,
            alertId: alert.id,
            status: broadcastResult.success ? 'sent' : 'failed',
            message: message,
            response: broadcastResult.response || null
          }
        });

        // Mettre à jour les stats du canal
        if (broadcastResult.success) {
          await prisma.broadcastChannel.update({
            where: { id: channel.id },
            data: {
              lastBroadcast: new Date(),
              broadcastCount: { increment: 1 }
            }
          });
        }

        results.push({
          channelId: channel.id,
          channelName: channel.name,
          platform: channel.platform,
          success: broadcastResult.success,
          message: broadcastResult.message
        });

      } catch (error) {
        console.error(`Erreur diffusion sur ${channel.name}:`, error);

        // Logger l'échec
        await prisma.broadcastLog.create({
          data: {
            channelId: channel.id,
            alertId: alert.id,
            status: 'failed',
            message: formatAlertMessage(alert, channel.platform),
            response: { error: error.message }
          }
        });

        results.push({
          channelId: channel.id,
          channelName: channel.name,
          platform: channel.platform,
          success: false,
          message: `Erreur: ${error.message}`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        alertId: alert.id,
        totalChannels: channels.length,
        successCount,
        failedCount,
        results
      },
      message: `Diffusion effectuée sur ${successCount}/${channels.length} canaux`
    });

  } catch (error) {
    console.error('Error broadcasting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la diffusion de l\'alerte',
      details: error.message
    });
  }
};

/**
 * GET /api/broadcast/history/:alertId
 * Récupérer l'historique de diffusion d'une alerte
 */
exports.getBroadcastHistory = async (req, res) => {
  try {
    const { alertId } = req.params;

    const logs = await prisma.broadcastLog.findMany({
      where: { alertId },
      include: {
        channel: {
          select: {
            name: true,
            platform: true
          }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Error fetching broadcast history:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique',
      details: error.message
    });
  }
};

/**
 * Formater le message selon la plateforme
 */
function formatAlertMessage(alert, platform) {
  const location = alert.location?.address || 'Localisation non spécifiée';
  const severity = alert.severity || 'medium';
  const severityEmoji = {
    'critical': '🚨',
    'high': '⚠️',
    'medium': '⚡',
    'low': 'ℹ️'
  };

  const categoryEmoji = {
    'Accident de circulation': '🚗',
    'Incendie': '🔥',
    'Inondation': '🌊',
    'Disparition': '👤',
    'Vol': '🥷',
    'Éboulement': '⛰️'
  };

  const emoji = categoryEmoji[alert.category] || '📢';
  const urgencyEmoji = severityEmoji[severity] || '📢';

  switch (platform) {
    case 'whatsapp':
    case 'telegram':
      return `${urgencyEmoji} *${alert.displayTitle || alert.title}*

${emoji} *Catégorie :* ${alert.category}
📍 *Localisation :* ${location}
🔴 *Gravité :* ${translateSeverity(severity)}

📝 *Description :*
${alert.description || 'Aucune description'}

⏰ *Signalé :* ${formatDate(alert.createdAt)}
🆔 *Référence :* ${alert.ref_alert_id}

${alert.mediaUrl ? `📸 Voir la photo : ${alert.mediaUrl}` : ''}

_Alerte diffusée par JAPAP - Restez vigilants !_`;

    case 'instagram':
      // Format plus court pour Instagram
      return `${urgencyEmoji} ${alert.displayTitle || alert.title}

${emoji} ${alert.category}
📍 ${location}
🔴 ${translateSeverity(severity)}

${alert.description ? alert.description.substring(0, 200) + '...' : ''}

#JAPAP #Alerte #${alert.category.replace(/\s+/g, '')} #Sécurité`;

    default:
      return `${alert.displayTitle || alert.title}\n\n${alert.description}`;
  }
}

/**
 * Envoyer le message au canal
 */
async function sendToChannel(channel, message, alert) {
  const { platform, credentials } = channel;

  switch (platform) {
    case 'whatsapp':
      // TODO: Implémenter WhatsApp Business API
      return sendWhatsAppMessage(credentials, message);

    case 'telegram':
      return sendTelegramMessage(credentials, message, alert);

    case 'instagram':
      // TODO: Implémenter Instagram Graph API
      return sendInstagramMessage(credentials, message, alert);

    default:
      return {
        success: false,
        message: 'Plateforme non supportée'
      };
  }
}

/**
 * Envoyer un message sur Telegram
 */
async function sendTelegramMessage(credentials, message, alert) {
  try {
    const TelegramBot = require('node-telegram-bot-api');
    const { botToken, channelUsername } = credentials;

    if (!botToken || !channelUsername) {
      return {
        success: false,
        message: 'Credentials Telegram manquants'
      };
    }

    // Créer une instance du bot
    const bot = new TelegramBot(botToken, { polling: false });

    // Envoyer le message au canal
    const result = await bot.sendMessage(channelUsername, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });

    // Si une image est disponible, l'envoyer aussi
    if (alert.mediaUrl) {
      try {
        await bot.sendPhoto(channelUsername, alert.mediaUrl, {
          caption: `📸 Photo de l'alerte ${alert.ref_alert_id}`
        });
      } catch (photoError) {
        console.error('Erreur envoi photo Telegram:', photoError.message);
        // Continue même si l'image échoue
      }
    }

    return {
      success: true,
      response: {
        messageId: result.message_id,
        chatId: result.chat.id,
        date: result.date,
        timestamp: new Date().toISOString()
      },
      message: 'Message envoyé sur Telegram avec succès'
    };

  } catch (error) {
    console.error('Erreur envoi Telegram:', error);
    return {
      success: false,
      response: { error: error.message },
      message: `Échec envoi Telegram: ${error.message}`
    };
  }
}

/**
 * Envoyer un message sur WhatsApp (Mock)
 */
async function sendWhatsAppMessage(credentials, message) {
  // Mock pour WhatsApp Business API
  await new Promise(resolve => setTimeout(resolve, 500));
  const isSuccess = Math.random() > 0.1;

  return {
    success: isSuccess,
    response: {
      messageId: `WA-${Date.now()}`,
      timestamp: new Date().toISOString()
    },
    message: isSuccess ? 'Message envoyé sur WhatsApp (MOCK)' : 'Échec envoi WhatsApp'
  };
}

/**
 * Envoyer un message sur Instagram (Mock)
 */
async function sendInstagramMessage(credentials, message, alert) {
  // Mock pour Instagram Graph API
  await new Promise(resolve => setTimeout(resolve, 500));
  const isSuccess = Math.random() > 0.1;

  return {
    success: isSuccess,
    response: {
      postId: `IG-${Date.now()}`,
      timestamp: new Date().toISOString()
    },
    message: isSuccess ? 'Post publié sur Instagram (MOCK)' : 'Échec publication Instagram'
  };
}

/**
 * Traduire le niveau de gravité
 */
function translateSeverity(severity) {
  const translations = {
    'critical': 'CRITIQUE',
    'high': 'ÉLEVÉE',
    'medium': 'MOYENNE',
    'low': 'FAIBLE'
  };
  return translations[severity] || severity.toUpperCase();
}

/**
 * Formater la date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
