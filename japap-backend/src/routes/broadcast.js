/**
 * Routes pour la diffusion d'alertes
 */

const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');

// Diffuser une alerte sur les canaux sélectionnés
router.post('/alert/:alertId', broadcastController.broadcastAlert);

// Récupérer l'historique de diffusion d'une alerte
router.get('/history/:alertId', broadcastController.getBroadcastHistory);

module.exports = router;
