/**
 * Routes pour gérer les webhooks entrants (Telegram, WhatsApp, etc.)
 */

const express = require('express');
const router = express.Router();
const telegramBotService = require('../services/telegramBotService');

/**
 * POST /api/webhooks/telegram
 * Recevoir les messages depuis Telegram
 */
router.post('/telegram', async (req, res) => {
  try {
    const update = req.body;

    // Valider que c'est bien un update Telegram
    if (!update || !update.update_id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Telegram update'
      });
    }

    // Log pour debug
    console.log('📨 Webhook Telegram reçu:', {
      updateId: update.update_id,
      hasChannelPost: !!update.channel_post,
      hasMessage: !!update.message
    });

    // Traiter le webhook de manière asynchrone
    telegramBotService.processWebhook(update);

    // Répondre immédiatement à Telegram (requis)
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('❌ Erreur webhook Telegram:', error);
    // Toujours répondre 200 à Telegram même en cas d'erreur interne
    res.status(200).json({ ok: true });
  }
});

/**
 * GET /api/webhooks/telegram/status
 * Vérifier le statut du bot Telegram
 */
router.get('/telegram/status', (req, res) => {
  const isInitialized = telegramBotService.isInitialized;

  res.json({
    success: true,
    data: {
      initialized: isInitialized,
      mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling'
    }
  });
});

module.exports = router;
