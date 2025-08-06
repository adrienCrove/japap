const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
// const authMiddleware = require('../middleware/authMiddleware'); // À décommenter plus tard

// Middleware pour protéger les routes d'alertes
// router.use(authMiddleware);

// POST /api/alerts
router.post('/', alertController.createAlert);

// GET /api/alerts
router.get('/', alertController.getAlerts);

// GET /api/alerts/nearby
router.get('/nearby', alertController.getNearbyAlerts);

// POST /api/alerts/:id/confirm
router.post('/:id/confirm', alertController.confirmAlert);

// POST /api/alerts/:id/expire
router.post('/:id/expire', alertController.expireAlert);

module.exports = router; 