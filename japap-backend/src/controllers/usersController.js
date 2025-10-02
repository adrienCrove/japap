const prisma = require('../config/prismaClient');

// POST /api/users - Créer un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      gender,
      role = 'user',
      status = 'active',
      birthDate,
      notes
    } = req.body;

    // reputationScore et location ne sont PAS fournis par l'utilisateur
    // Ils sont gérés automatiquement par le système
    const reputationScore = 100; // Score initial fixe
    const location = null; // Pas de localisation à la création

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Le numéro de téléphone est requis'
      });
    }

    // Validation du format du téléphone camerounais
    const phoneRegex = /^(\+237)?6\d{8}$/;
    const cleanedPhone = phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Format de numéro de téléphone invalide. Format attendu: 6XX XXX XXX ou +237 6XX XXX XXX'
      });
    }

    // Vérifier si le numéro existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanedPhone }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Un utilisateur avec ce numéro de téléphone existe déjà'
      });
    }

    // Validation du rôle
    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide. Valeurs autorisées: user, moderator, admin'
      });
    }

    // Validation du statut
    const validStatuses = ['active', 'pending', 'suspended', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide. Valeurs autorisées: active, pending, suspended, blocked'
      });
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        phone: cleanedPhone,
        email,
        gender,
        role,
        status,
        reputationScore,
        location,
        birthDate: birthDate ? new Date(birthDate) : null,
        notes
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'utilisateur',
      details: error.message
    });
  }
};

// GET /api/users - Lister tous les utilisateurs avec filtres
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;

    const where = {};

    // Filtres
    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          gender: true,
          role: true,
          status: true,
          reputationScore: true,
          location: true,
          birthDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              alerts: true,
              confirmations: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs',
      details: error.message
    });
  }
};

// GET /api/users/:id - Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            alerts: true,
            confirmations: true,
            notifications: true,
            subscriptions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'utilisateur',
      details: error.message
    });
  }
};

// PUT /api/users/:id - Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      gender,
      role,
      status,
      birthDate,
      notes
    } = req.body;

    // reputationScore et location ne peuvent PAS être modifiés manuellement
    // reputationScore est géré par le système via updateUserReputation
    // location n'est pas utilisé dans ce système

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Si le téléphone est modifié, vérifier qu'il n'existe pas déjà
    if (phone && phone !== existingUser.phone) {
      const cleanedPhone = phone.replace(/\s/g, '');
      const phoneExists = await prisma.user.findUnique({
        where: { phone: cleanedPhone }
      });

      if (phoneExists) {
        return res.status(409).json({
          success: false,
          error: 'Ce numéro de téléphone est déjà utilisé'
        });
      }
    }

    // Validation du rôle si fourni
    if (role) {
      const validRoles = ['user', 'moderator', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Rôle invalide'
        });
      }
    }

    // Validation du statut si fourni
    if (status) {
      const validStatuses = ['active', 'pending', 'suspended', 'blocked'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Statut invalide'
        });
      }
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone.replace(/\s/g, '');
    if (email !== undefined) updateData.email = email;
    if (gender !== undefined) updateData.gender = gender;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    // reputationScore et location sont EXCLUS - ne peuvent pas être modifiés manuellement
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
    if (notes !== undefined) updateData.notes = notes;

    // Mettre à jour l'utilisateur
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'utilisateur',
      details: error.message
    });
  }
};

// DELETE /api/users/:id - Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            alerts: true,
            confirmations: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier s'il y a des dépendances
    if (user._count.alerts > 0 || user._count.confirmations > 0) {
      return res.status(409).json({
        success: false,
        error: 'Impossible de supprimer cet utilisateur car il a des alertes ou confirmations associées',
        details: {
          alerts: user._count.alerts,
          confirmations: user._count.confirmations
        }
      });
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'utilisateur',
      details: error.message
    });
  }
};

// PATCH /api/users/:id/status - Changer le statut d'un utilisateur (utilitaire)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'pending', 'suspended', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: user,
      message: `Statut de l'utilisateur mis à jour: ${status}`
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut',
      details: error.message
    });
  }
};

// PATCH /api/users/:id/reputation - Ajuster le score de réputation (utilitaire)
exports.updateUserReputation = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body; // delta peut être positif ou négatif

    if (typeof delta !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Le delta de réputation doit être un nombre'
      });
    }

    // Récupérer le score actuel
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { reputationScore: true }
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Calculer le nouveau score (limité entre 0 et 100)
    const newScore = Math.max(0, Math.min(100, currentUser.reputationScore + delta));

    const user = await prisma.user.update({
      where: { id },
      data: { reputationScore: newScore }
    });

    res.json({
      success: true,
      data: user,
      message: `Score de réputation ajusté: ${delta > 0 ? '+' : ''}${delta} (nouveau score: ${newScore})`
    });

  } catch (error) {
    console.error('Error updating user reputation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du score de réputation',
      details: error.message
    });
  }
};
