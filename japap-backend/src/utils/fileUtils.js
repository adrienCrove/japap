/**
 * Utilitaires de gestion de fichiers et dossiers
 * Gestion de l'organisation des images par répertoires
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Génère un nom de fichier unique avec timestamp
 * @param {string} originalFilename - Nom original du fichier
 * @returns {string} - Nom de fichier sécurisé et unique
 */
function generateUniqueFilename(originalFilename) {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalFilename).toLowerCase();
  const safeName = path.basename(originalFilename, ext)
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50); // Limiter la longueur

  return `${timestamp}-${randomHash}-${safeName}${ext}`;
}

/**
 * Crée la structure de répertoires pour un type de contenu
 * @param {string} category - "alert", "user", "admin", "broadcast", "temp"
 * @param {string} entityId - ID de l'entité (alert ID, user ID, etc.)
 * @returns {Promise<string>} - Chemin absolu du répertoire créé
 */
async function createDirectoryStructure(category, entityId = null) {
  const baseDir = path.join(process.cwd(), 'public', 'uploads');

  let targetDir;
  if (entityId) {
    // Structure: /uploads/alerts/alert-123/
    targetDir = path.join(baseDir, `${category}s`, `${category}-${entityId}`);
  } else {
    // Structure: /uploads/temp/ ou /uploads/admin/
    targetDir = path.join(baseDir, category);
  }

  await fs.mkdir(targetDir, { recursive: true });
  return targetDir;
}

/**
 * Génère le chemin relatif pour l'URL publique
 * @param {string} category - Catégorie
 * @param {string} entityId - ID de l'entité
 * @param {string} filename - Nom du fichier
 * @returns {string} - Chemin relatif: /uploads/alerts/alert-123/image.jpg
 */
function getRelativePath(category, entityId, filename) {
  if (entityId) {
    return `/uploads/${category}s/${category}-${entityId}/${filename}`;
  }
  return `/uploads/${category}/${filename}`;
}

/**
 * Génère l'URL complète
 * @param {string} relativePath - Chemin relatif
 * @param {string} baseUrl - URL de base du serveur (optionnel)
 * @returns {string} - URL complète
 */
function getFullUrl(relativePath, baseUrl = null) {
  if (baseUrl) {
    return `${baseUrl}${relativePath}`;
  }
  // Si pas de baseUrl, retourner le chemin relatif (sera construit côté client)
  return relativePath;
}

/**
 * Sauvegarde un fichier dans le répertoire approprié
 * @param {Buffer} fileBuffer - Contenu du fichier
 * @param {string} category - Catégorie
 * @param {string} entityId - ID de l'entité
 * @param {string} originalFilename - Nom original
 * @returns {Promise<Object>} - Informations sur le fichier sauvegardé
 */
async function saveFile(fileBuffer, category, entityId, originalFilename) {
  // Créer le répertoire
  const dirPath = await createDirectoryStructure(category, entityId);

  // Générer un nom unique
  const uniqueFilename = generateUniqueFilename(originalFilename);

  // Chemin complet du fichier
  const filePath = path.join(dirPath, uniqueFilename);

  // Écrire le fichier
  await fs.writeFile(filePath, fileBuffer);

  // Chemin relatif pour l'URL
  const relativePath = getRelativePath(category, entityId, uniqueFilename);

  return {
    filename: uniqueFilename,
    originalName: originalFilename,
    path: relativePath,
    absolutePath: filePath,
    size: fileBuffer.length,
  };
}

/**
 * Crée un fichier metadata.json dans le répertoire
 * @param {string} category - Catégorie
 * @param {string} entityId - ID de l'entité
 * @param {Object} metadata - Métadonnées à sauvegarder
 */
async function saveMetadata(category, entityId, metadata) {
  const dirPath = await createDirectoryStructure(category, entityId);
  const metadataPath = path.join(dirPath, 'metadata.json');

  let existingMetadata = {};

  // Charger les métadonnées existantes si elles existent
  try {
    const existing = await fs.readFile(metadataPath, 'utf-8');
    existingMetadata = JSON.parse(existing);
  } catch (error) {
    // Fichier n'existe pas encore
  }

  // Fusionner avec les nouvelles métadonnées
  const updatedMetadata = {
    ...existingMetadata,
    ...metadata,
    lastUpdated: new Date().toISOString(),
  };

  await fs.writeFile(
    metadataPath,
    JSON.stringify(updatedMetadata, null, 2),
    'utf-8'
  );
}

/**
 * Lit les métadonnées d'un répertoire
 * @param {string} category - Catégorie
 * @param {string} entityId - ID de l'entité
 * @returns {Promise<Object|null>} - Métadonnées ou null
 */
async function readMetadata(category, entityId) {
  const dirPath = path.join(process.cwd(), 'public', 'uploads', `${category}s`, `${category}-${entityId}`);
  const metadataPath = path.join(dirPath, 'metadata.json');

  try {
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Supprime un fichier
 * @param {string} relativePath - Chemin relatif du fichier
 * @returns {Promise<boolean>} - Succès de la suppression
 */
async function deleteFile(relativePath) {
  try {
    const absolutePath = path.join(process.cwd(), 'public', relativePath);
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${relativePath}:`, error.message);
    return false;
  }
}

/**
 * Supprime un répertoire et son contenu
 * @param {string} category - Catégorie
 * @param {string} entityId - ID de l'entité
 * @returns {Promise<boolean>} - Succès de la suppression
 */
async function deleteDirectory(category, entityId) {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'uploads', `${category}s`, `${category}-${entityId}`);
    await fs.rm(dirPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du répertoire ${category}-${entityId}:`, error.message);
    return false;
  }
}

/**
 * Liste tous les fichiers d'un répertoire
 * @param {string} category - Catégorie
 * @param {string} entityId - ID de l'entité
 * @returns {Promise<Array>} - Liste des fichiers
 */
async function listFiles(category, entityId) {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'uploads', `${category}s`, `${category}-${entityId}`);
    const files = await fs.readdir(dirPath);

    // Filtrer les métadonnées
    return files.filter(file => file !== 'metadata.json');
  } catch (error) {
    return [];
  }
}

/**
 * Nettoie les répertoires temporaires vieux de plus de X heures
 * @param {number} hoursOld - Nombre d'heures
 * @returns {Promise<number>} - Nombre de fichiers supprimés
 */
async function cleanupTempFiles(hoursOld = 24) {
  try {
    const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp');

    if (!fsSync.existsSync(tempDir)) {
      return 0;
    }

    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const maxAge = hoursOld * 60 * 60 * 1000; // Convertir en millisecondes

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    console.log(`🧹 Nettoyage: ${deletedCount} fichiers temporaires supprimés`);
    return deletedCount;
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers temporaires:', error.message);
    return 0;
  }
}

/**
 * Obtient les dimensions d'une image
 * @param {Buffer} imageBuffer - Buffer de l'image
 * @returns {Promise<Object>} - { width, height }
 */
async function getImageDimensions(imageBuffer) {
  try {
    // Utiliser sharp si disponible pour obtenir les dimensions
    const sharp = require('sharp');
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    // Sharp n'est pas installé ou erreur
    return { width: null, height: null };
  }
}

/**
 * Valide le type MIME d'un fichier
 * @param {string} mimeType - Type MIME
 * @returns {boolean} - Valide ou non
 */
function isValidImageType(mimeType) {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  return validTypes.includes(mimeType.toLowerCase());
}

/**
 * Valide la taille d'un fichier
 * @param {number} size - Taille en bytes
 * @param {number} maxSize - Taille max en bytes (défaut: 10MB)
 * @returns {boolean} - Valide ou non
 */
function isValidFileSize(size, maxSize = 10 * 1024 * 1024) {
  return size <= maxSize;
}

module.exports = {
  generateUniqueFilename,
  createDirectoryStructure,
  getRelativePath,
  getFullUrl,
  saveFile,
  saveMetadata,
  readMetadata,
  deleteFile,
  deleteDirectory,
  listFiles,
  cleanupTempFiles,
  getImageDimensions,
  isValidImageType,
  isValidFileSize,
};
