const express = require('express');
const router = express.Router();
const categoryAlertsController = require('../controllers/categoryAlertsController');

// Routes pour les catégories d'alertes

// GET /api/category-alerts - Liste toutes les catégories actives
router.get('/', categoryAlertsController.getAllCategoryAlerts);

// GET /api/category-alerts/stats - Statistiques des catégories
router.get('/stats', categoryAlertsController.getCategoryStats);

// GET /api/category-alerts/search - Recherche par keywords
router.get('/search', categoryAlertsController.searchCategoryByKeywords);

// GET /api/category-alerts/priority/:priority - Filtrer par priorité
router.get('/priority/:priority', categoryAlertsController.getCategoryAlertsByPriority);

// GET /api/category-alerts/code/:code - Récupérer par code (ex: MEDC)
router.get('/code/:code', categoryAlertsController.getCategoryAlertByCode);

// GET /api/category-alerts/:id - Récupérer par ID
router.get('/:id', categoryAlertsController.getCategoryAlertById);

module.exports = router;
