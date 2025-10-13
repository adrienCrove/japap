const prisma = require('../config/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'japap_secret_key_change_in_production';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/check-user - Vérifier si un utilisateur existe
exports.checkUser = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        error: 'Email ou téléphone requis'
      });
    }

    // Nettoyer le téléphone si c'est un numéro
    const cleanPhone = emailOrPhone.replace(/\s/g, '');
    const isPhone = /^\+?237?6\d{8}$/.test(cleanPhone);

    // Chercher par email ou phone
    const user = await prisma.user.findFirst({
      where: isPhone
        ? { phone: cleanPhone }
        : { email: emailOrPhone }
    });

    if (!user) {
      return res.json({
        success: true,
        exists: false,
        needsPassword: false
      });
    }

    res.json({
      success: true,
      exists: true,
      needsPassword: !!user.password,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de l\'utilisateur',
      details: error.message
    });
  }
};

// POST /api/auth/register - Créer un nouveau compte
exports.register = async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      fullname,
      address,
      interests // Array de codes: ['nearby_alerts', 'breaking_news', ...]
    } = req.body;

    // Validation
    if (!phone || !password || !fullname) {
      return res.status(400).json({
        success: false,
        error: 'Téléphone, mot de passe et nom complet requis'
      });
    }

    // Nettoyer et valider le téléphone
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^\+?237?6\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Format de numéro invalide. Format attendu: +237 6XX XX XX XX'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Un compte avec ce numéro existe déjà'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        phone: cleanPhone,
        email: email || null,
        password: hashedPassword,
        name: fullname,
        notes: address || null,
        status: 'active',
        role: 'user',
        reputationScore: 100
      }
    });

    // Créer les relations UserInterest si des intérêts sont fournis
    if (interests && interests.length > 0) {
      // Récupérer les IDs des intérêts par leurs codes
      const interestRecords = await prisma.interest.findMany({
        where: {
          code: { in: interests }
        }
      });

      // Créer les relations
      await prisma.userInterest.createMany({
        data: interestRecords.map(interest => ({
          userId: user.id,
          interestId: interest.id
        }))
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Retourner l'utilisateur sans le password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du compte',
      details: error.message
    });
  }
};

// POST /api/auth/login - Connexion
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/téléphone et mot de passe requis'
      });
    }

    // Nettoyer le téléphone si c'est un numéro
    const cleanPhone = emailOrPhone.replace(/\s/g, '');
    const isPhone = /^\+?237?6\d{8}$/.test(cleanPhone);

    // Chercher l'utilisateur
    const user = await prisma.user.findFirst({
      where: isPhone
        ? { phone: cleanPhone }
        : { email: emailOrPhone }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: 'Ce compte n\'a pas de mot de passe configuré'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Vérifier le statut du compte
    if (user.status === 'blocked' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Votre compte a été ' + (user.status === 'blocked' ? 'bloqué' : 'suspendu')
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Retourner l'utilisateur sans le password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion',
      details: error.message
    });
  }
}; 