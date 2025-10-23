const express = require('express');
const router = express.Router();
const multer = require('multer');
const alertsController = require('../controllers/alertsController');

// Configuration multer pour gérer les uploads en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Routes pour les alertes
router.post('/', alertsController.createAlert);
router.post('/create-with-enhancement', upload.single('image'), alertsController.createAlertWithEnhancement);
router.get('/', alertsController.getAllAlerts);
router.get('/:id', alertsController.getAlertById);
router.put('/:id', alertsController.updateAlert);
router.patch('/:id/share', alertsController.shareAlert);

module.exports = router;
