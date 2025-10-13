const express = require('express');
const router = express.Router();
const interestsController = require('../controllers/interestsController');

// POST /api/interests/seed - Seeder pour créer les intérêts prédéfinis
router.post('/seed', interestsController.seedInterests);

// GET /api/interests - Lister tous les intérêts
router.get('/', interestsController.getAllInterests);

module.exports = router;
