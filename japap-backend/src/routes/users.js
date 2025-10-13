const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyToken, requireAdmin, requireModerator } = require('../middleware/authMiddleware');

// Routes CRUD pour les utilisateurs
// Toutes les routes nécessitent une authentification
// Les routes sensibles nécessitent un rôle admin

// POST /api/users - Créer un nouvel utilisateur (admin seulement)
router.post('/', verifyToken, requireAdmin, usersController.createUser);

// GET /api/users - Lister tous les utilisateurs (modérateur ou admin)
router.get('/', verifyToken, requireModerator, usersController.getAllUsers);

// GET /api/users/:id - Obtenir un utilisateur par ID (modérateur ou admin)
router.get('/:id', verifyToken, requireModerator, usersController.getUserById);

// PUT /api/users/:id - Mettre à jour un utilisateur (admin seulement)
router.put('/:id', verifyToken, requireAdmin, usersController.updateUser);

// DELETE /api/users/:id - Supprimer un utilisateur (admin seulement)
router.delete('/:id', verifyToken, requireAdmin, usersController.deleteUser);

// PATCH /api/users/:id/status - Changer le statut d'un utilisateur (admin seulement)
router.patch('/:id/status', verifyToken, requireAdmin, usersController.updateUserStatus);

// PATCH /api/users/:id/reputation - Ajuster le score de réputation (modérateur ou admin)
router.patch('/:id/reputation', verifyToken, requireModerator, usersController.updateUserReputation);

// PATCH /api/users/:id/password - Changer le mot de passe d'un utilisateur (admin seulement)
router.patch('/:id/password', verifyToken, requireAdmin, usersController.updateUserPassword);

module.exports = router;
