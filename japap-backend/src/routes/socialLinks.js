const express = require('express');
const router = express.Router();
const socialLinksController = require('../controllers/socialLinksController');

router.get('/', socialLinksController.getAllSocialLinks);
router.post('/', socialLinksController.createSocialLink);
router.put('/:id', socialLinksController.updateSocialLink);
router.delete('/:id', socialLinksController.deleteSocialLink);

module.exports = router;
