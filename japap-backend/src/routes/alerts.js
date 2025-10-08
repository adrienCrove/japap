const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');

// Définir les routes pour les alertes
router.post('/', alertsController.createAlert);
router.get('/', alertsController.getAllAlerts);
router.get('/:id', alertsController.getAlertById);
router.put('/:id', alertsController.updateAlert);

module.exports = router;
