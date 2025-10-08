/**
 * Service pour gérer le bot Telegram et créer des alertes automatiquement
 */

const TelegramBot = require('node-telegram-bot-api');
const prisma = require('../config/prismaClient');
const messageParser = require('./messageParser');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isInitialized = false;
    this.lastErrorTime = null;
  }

  /**
   * Initialiser le bot Telegram
   */
  initialize() {
    // Vérifier si le bot est activé
    const isEnabled = process.env.TELEGRAM_BOT_ENABLED === 'true';

    if (!isEnabled) {
      console.log('ℹ️  Bot Telegram désactivé (TELEGRAM_BOT_ENABLED=false)');
      return;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.warn('⚠️  TELEGRAM_BOT_TOKEN non défini dans .env - Bot Telegram désactivé');
      return;
    }

    try {
      // Mode webhook pour production, polling pour dev
      const useWebhook = process.env.NODE_ENV === 'production';

      this.bot = new TelegramBot(token, {
        polling: !useWebhook,  // Polling en dev, webhook en prod
        request: {
          // Timeout personnalisé pour éviter les blocages
          timeout: 30000,
          // Support proxy si configuré
          proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY
        }
      });

      // Écouter les messages des canaux
      this.bot.on('channel_post', (msg) => this.handleChannelMessage(msg));

      // Écouter les erreurs de polling avec gestion améliorée
      this.bot.on('polling_error', (error) => {
        // Ne pas logger les erreurs EFATAL répétées
        if (error.code === 'EFATAL') {
          if (!this.lastErrorTime || Date.now() - this.lastErrorTime > 60000) {
            console.error('❌ Erreur connexion Telegram (réseau bloqué ou inaccessible)');
            console.log('💡 Solution: Définir TELEGRAM_BOT_ENABLED=false dans .env pour désactiver le bot');
            this.lastErrorTime = Date.now();
          }
        } else {
          console.error('❌ Telegram polling error:', error.message);
        }
      });

      this.isInitialized = true;
      console.log('✅ Telegram Bot initialisé avec succès (mode: ' + (useWebhook ? 'webhook' : 'polling') + ')');

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du bot Telegram:', error.message);
      console.log('ℹ️  Le serveur continuera de fonctionner sans le bot Telegram');
    }
  }

  /**
   * Gérer un message reçu d'un canal Telegram
   * @param {Object} msg - Message Telegram
   */
  async handleChannelMessage(msg) {
    try {
      console.log('📨 Nouveau message du canal:', msg.chat.title);

      const channelId = msg.chat.id.toString();
      const messageText = msg.text || msg.caption || '';
      const messageId = msg.message_id;

      // Vérifier si la source est surveillée
      const source = await prisma.monitoredSource.findFirst({
        where: {
          platform: 'telegram',
          scrapingConfig: {
            //path: ['channelId'],
            path: "-3061427450",
            equals: channelId
          },
          isActive: true
        }
      });

      if (!source) {
        console.log('⏭️  Canal non surveillé, message ignoré');
        return;
      }

      // Parser le message pour détecter une alerte
      const alertData = messageParser.parseForAlert(messageText);

      if (!alertData.isAlert) {
        console.log('ℹ️  Message ne contient pas d\'alerte');
        return;
      }

      // Créer l'alerte dans JAPAP
      const alert = await this.createAlertFromTelegram({
        ...alertData,
        sourceId: source.id,
        sourceName: source.name,
        channelUsername: msg.chat.username,
        messageId: messageId,
        mediaUrl: this.extractMediaUrl(msg)
      });

      if (alert) {
        console.log('✅ Alerte créée:', alert.ref_alert_id);

        // Mettre à jour le compteur de la source
        await prisma.monitoredSource.update({
          where: { id: source.id },
          data: {
            contentCount: { increment: 1 },
            lastScraped: new Date()
          }
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors du traitement du message Telegram:', error);
    }
  }

  /**
   * Créer une alerte JAPAP depuis un message Telegram
   * @param {Object} data - Données de l'alerte
   * @returns {Object} - Alerte créée
   */
  async createAlertFromTelegram(data) {
    try {
      const refId = `TG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();

      const alert = await prisma.alert.create({
        data: {
          ref_alert_id: refId,
          title: `${data.category.toUpperCase()} - ${data.location}`,
          displayTitle: `Alerte ${data.category}: ${data.location}`,
          category: data.category,
          description: data.description,
          severity: data.severity,
          status: 'pending',  // En attente de modération
          source: 'telegram',
          mediaUrl: data.mediaUrl,
          location: {
            address: data.location,
            coordinates: [0, 0]  // TODO: Géocoder l'adresse
          },
          categorySpecificFields: {
            telegramChannelUsername: data.channelUsername,
            telegramMessageId: data.messageId,
            confidence: data.confidence,
            sourceName: data.sourceName
          }
        }
      });

      return alert;

    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'alerte:', error);
      return null;
    }
  }

  /**
   * Extraire l'URL du média (photo, vidéo) d'un message
   * @param {Object} msg - Message Telegram
   * @returns {string|null} - URL du média ou null
   */
  extractMediaUrl(msg) {
    if (msg.photo && msg.photo.length > 0) {
      // Récupérer la photo en meilleure qualité
      const photo = msg.photo[msg.photo.length - 1];
      return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${photo.file_id}`;
    }

    if (msg.video) {
      return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${msg.video.file_id}`;
    }

    return null;
  }

  /**
   * Configurer le webhook pour un serveur de production
   * @param {string} webhookUrl - URL publique du webhook
   */
  async setWebhook(webhookUrl) {
    if (!this.bot) {
      throw new Error('Bot non initialisé');
    }

    try {
      await this.bot.setWebHook(webhookUrl);
      console.log('✅ Webhook Telegram configuré:', webhookUrl);
    } catch (error) {
      console.error('❌ Erreur lors de la configuration du webhook:', error);
      throw error;
    }
  }

  /**
   * Traiter un webhook Telegram (pour mode production)
   * @param {Object} update - Update Telegram
   */
  async processWebhook(update) {
    if (update.channel_post) {
      await this.handleChannelMessage(update.channel_post);
    }
  }
}

// Singleton
const telegramBotService = new TelegramBotService();

module.exports = telegramBotService;
