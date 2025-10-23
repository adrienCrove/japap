const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Routes publiques
router.get('/', newsController.getAllNews);
router.get('/trending', newsController.getTrendingNews);
router.get('/stats', newsController.getNewsStats);
router.get('/sources', newsController.getSources);
router.get('/category/:category', newsController.getNewsByCategory);
router.get('/related/:alertId', newsController.getRelatedNews);
router.get('/slug/:slug', newsController.getNewsBySlug);
router.get('/:id', newsController.getNewsById);

// Routes admin (à protéger avec middleware d'authentification)
// TODO: Ajouter middleware auth admin
router.post('/', newsController.createNews);
router.put('/:id', newsController.updateNews);
router.delete('/:id', newsController.deleteNews);

module.exports = router;
