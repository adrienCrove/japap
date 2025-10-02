const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// Routes CRUD pour les utilisateurs

// POST /api/users - Créer un nouvel utilisateur
router.post('/', usersController.createUser);

// GET /api/users - Lister tous les utilisateurs (avec filtres)
router.get('/', usersController.getAllUsers);

// GET /api/users/:id - Obtenir un utilisateur par ID
router.get('/:id', usersController.getUserById);

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', usersController.updateUser);

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', usersController.deleteUser);

// PATCH /api/users/:id/status - Changer le statut d'un utilisateur
router.patch('/:id/status', usersController.updateUserStatus);

// PATCH /api/users/:id/reputation - Ajuster le score de réputation
router.patch('/:id/reputation', usersController.updateUserReputation);

module.exports = router;
