/**
 * Middleware Multer configuré par type de média
 * Validation stricte: IMAGE (5MB), AUDIO (5MB), VIDEO (5MB)
 */

const multer = require('multer');
const { VALIDATION_RULES } = require('../utils/mediaValidation');

/**
 * Crée un middleware Multer configuré pour un type de média spécifique
 * @param {string} mediaType - 'IMAGE', 'AUDIO', ou 'VIDEO'
 * @returns {multer.Multer} Middleware multer configuré
 */
function createUploadMiddleware(mediaType) {
  const rules = VALIDATION_RULES[mediaType];

  if (!rules) {
    throw new Error(`Type de média invalide: ${mediaType}`);
  }

  return multer({
    storage: multer.memoryStorage(), // Stockage en mémoire pour validation avant écriture
    limits: {
      fileSize: rules.maxSize, // 5 MB pour tous les types
      files: 1, // Un seul fichier à la fois
      fields: 10, // Limite nombre de champs metadata
    },
    fileFilter: (req, file, cb) => {
      // 1. Vérifier MIME type
      if (!rules.allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
        return cb(
          new Error(
            `Format non autorisé: ${file.mimetype}. Formats acceptés: ${rules.allowedMimeTypes.join(', ')}`
          )
        );
      }

      // 2. Vérifier extension (basique)
      const path = require('path');
      const ext = path.extname(file.originalname).toLowerCase();

      if (!rules.allowedExtensions.includes(ext)) {
        return cb(
          new Error(
            `Extension non autorisée: ${ext}. Extensions acceptées: ${rules.allowedExtensions.join(', ')}`
          )
        );
      }

      // Validation réussie
      cb(null, true);
    },
  });
}

/**
 * Middleware pour upload d'image (max 5MB)
 */
const uploadImage = createUploadMiddleware('IMAGE').single('file');

/**
 * Middleware pour upload d'audio (max 5MB)
 */
const uploadAudio = createUploadMiddleware('AUDIO').single('file');

/**
 * Middleware pour upload de vidéo (max 5MB)
 */
const uploadVideo = createUploadMiddleware('VIDEO').single('file');

/**
 * Middleware pour upload de plusieurs images (max 3)
 */
const uploadMultipleImages = createUploadMiddleware('IMAGE').array('images', 3);

/**
 * Gestionnaire d'erreur Multer
 * Convertit les erreurs Multer en réponses JSON
 */
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Erreur Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: `Fichier trop volumineux. Taille maximale: 5 MB`,
        code: 'FILE_TOO_LARGE',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Trop de fichiers. Maximum 3 images par alerte.',
        code: 'TOO_MANY_FILES',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Champ de fichier inattendu',
        code: 'UNEXPECTED_FIELD',
      });
    }

    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if (err) {
    // Erreur personnalisée (fileFilter)
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  next();
}

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo,
  uploadMultipleImages,
  handleMulterError,
  createUploadMiddleware,
};
