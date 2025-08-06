const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');

// Définir les routes pour les alertes
router.post('/', alertsController.createAlert);
router.get('/', alertsController.getAllAlerts);

module.exports = router;
