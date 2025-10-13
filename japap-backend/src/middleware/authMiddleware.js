const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'japap_secret_key_change_in_production';

/**
 * Middleware pour vérifier l'authentification JWT
 * Vérifie le token et ajoute les infos utilisateur dans req.user
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ajouter les infos utilisateur dans la requête
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
      email: decoded.email
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur d\'authentification'
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur a un rôle admin
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux administrateurs'
    });
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur a un rôle admin ou moderator
 */
exports.requireModerator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux modérateurs et administrateurs'
    });
  }

  next();
};

/**
 * Middleware optionnel - Ajoute les infos utilisateur si token présent, mais ne bloque pas si absent
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // En mode optionnel, on continue même si le token est invalide
    next();
  }
};
