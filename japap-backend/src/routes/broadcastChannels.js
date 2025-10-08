/**
 * Routes pour gérer les canaux de diffusion
 */

const express = require('express');
const router = express.Router();
const broadcastChannelsController = require('../controllers/broadcastChannelsController');

// Récupérer tous les canaux
router.get('/', broadcastChannelsController.getAllChannels);

// Récupérer un canal spécifique
router.get('/:id', broadcastChannelsController.getChannelById);

// Créer un nouveau canal
router.post('/', broadcastChannelsController.createChannel);

// Mettre à jour un canal
router.put('/:id', broadcastChannelsController.updateChannel);

// Supprimer un canal
router.delete('/:id', broadcastChannelsController.deleteChannel);

// Activer/Désactiver un canal
router.patch('/:id/toggle', broadcastChannelsController.toggleChannel);

module.exports = router;
