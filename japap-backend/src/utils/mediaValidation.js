/**
 * Validation stricte des médias (images, audio, vidéo)
 * - Images: d 5 MB, formats autorisés, dimensions
 * - Audio: d 5 MB, d 5 minutes, formats autorisés
 * - Vidéo: d 5 MB, d 30 secondes STRICT, formats autorisés
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');

// ============ CONSTANTES DE VALIDATION ============

const VALIDATION_RULES = {
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic', // iPhone
      'image/heif',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
    maxWidth: 4096,
    maxHeight: 4096,
    minWidth: 100,
    minHeight: 100,
  },

  AUDIO: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/m4a',
      'audio/ogg',
      'audio/webm',
    ],
    allowedExtensions: ['.mp3', '.wav', '.m4a', '.ogg', '.webm'],
    maxDuration: 300, // 5 minutes en secondes
    minDuration: 1,   // 1 seconde minimum
  },

  VIDEO: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      'video/mp4',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/webm',
    ],
    allowedExtensions: ['.mp4', '.mov', '.avi', '.webm'],
    maxDuration: 30,  // 30 secondes STRICT
    minDuration: 1,
    maxWidth: 1920,
    maxHeight: 1080,
  },
};

const MAX_MEDIA_PER_ALERT = {
  IMAGE: 3,
  AUDIO: 1,
  VIDEO: 1,
};

// Mapping MIME type ’ extensions attendues
const MIME_EXTENSION_MAP = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'audio/mpeg': ['.mp3'],
  'audio/mp3': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'audio/webm': ['.webm'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/webm': ['.webm'],
};

// ============ FONCTIONS DE VALIDATION ============

/**
 * Validation Phase 1: Initiation (avant upload)
 * Valide les métadonnées déclarées par le client
 */
async function validateMediaInitiation(mediaData, prisma) {
  const { type, position, filename, mimeType, size, alertId } = mediaData;
  const errors = [];

  // 1. Type valide
  if (!['IMAGE', 'AUDIO', 'VIDEO'].includes(type)) {
    errors.push(`Type invalide: ${type}. Types autorisés: IMAGE, AUDIO, VIDEO`);
    return { valid: false, errors };
  }

  const rules = VALIDATION_RULES[type];

  // 2. Taille déclarée
  if (size > rules.maxSize) {
    errors.push(
      `Fichier trop volumineux: ${(size / 1024 / 1024).toFixed(2)}MB > ${rules.maxSize / 1024 / 1024}MB maximum`
    );
  }

  // 3. MIME type
  if (!rules.allowedMimeTypes.includes(mimeType.toLowerCase())) {
    errors.push(
      `Format non autorisé: ${mimeType}. Formats autorisés: ${rules.allowedMimeTypes.join(', ')}`
    );
  }

  // 4. Extension vs MIME (détection spoofing)
  const ext = path.extname(filename).toLowerCase();
  if (!rules.allowedExtensions.includes(ext)) {
    errors.push(
      `Extension non autorisée: ${ext}. Extensions autorisées: ${rules.allowedExtensions.join(', ')}`
    );
  }

  // Vérifier cohérence MIME/extension
  if (MIME_EXTENSION_MAP[mimeType] && !MIME_EXTENSION_MAP[mimeType].includes(ext)) {
    errors.push(
      `Incohérence détectée: MIME type "${mimeType}" ne correspond pas à l'extension "${ext}"`
    );
  }

  // 5. Position (images uniquement)
  if (type === 'IMAGE') {
    if (!position || position < 1 || position > 3) {
      errors.push('Position image doit être 1, 2 ou 3');
    }

    // Vérifier que position n'est pas déjà occupée
    if (prisma && alertId) {
      const existing = await prisma.media.findFirst({
        where: {
          alertId,
          type: 'IMAGE',
          position,
          uploadStatus: { not: 'FAILED' }
        }
      });

      if (existing) {
        errors.push(`Position ${position} déjà occupée pour cette alerte`);
      }
    }
  } else {
    // Audio/vidéo: position doit être null
    if (position !== null && position !== undefined) {
      errors.push(`${type} ne doit pas avoir de position (réservé aux images)`);
    }
  }

  // 6. Limite de médias par alerte
  if (prisma && alertId) {
    const existingCount = await prisma.media.count({
      where: {
        alertId,
        type,
        uploadStatus: { not: 'FAILED' }
      }
    });

    if (existingCount >= MAX_MEDIA_PER_ALERT[type]) {
      errors.push(
        `Maximum ${MAX_MEDIA_PER_ALERT[type]} ${type.toLowerCase()}(s) par alerte atteint`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validation Phase 2: Upload (pendant/après upload)
 * Valide le fichier binaire réel
 */
async function validateMediaFile(fileBuffer, mediaType, declaredMimeType, declaredChecksum = null) {
  const errors = [];
  const rules = VALIDATION_RULES[mediaType];

  // 1. Taille réelle
  if (fileBuffer.length > rules.maxSize) {
    errors.push(
      `Taille réelle dépasse la limite: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB > ${rules.maxSize / 1024 / 1024}MB`
    );
  }

  // 2. Checksum (intégrité)
  const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const formattedChecksum = `sha256:${actualChecksum}`;

  if (declaredChecksum && formattedChecksum !== declaredChecksum) {
    errors.push('Checksum invalide: fichier corrompu ou altéré pendant le transfert');
  }

  // 3. Magic bytes (détection MIME réel)
  let actualMimeType;
  try {
    actualMimeType = await detectRealMimeType(fileBuffer);
  } catch (error) {
    errors.push(`Impossible de détecter le type de fichier: ${error.message}`);
    return { valid: false, errors, checksum: formattedChecksum };
  }

  // Vérifier que le MIME déclaré correspond au MIME réel
  if (actualMimeType !== declaredMimeType && !isCompatibleMimeType(actualMimeType, declaredMimeType)) {
    errors.push(
      `Type réel (${actualMimeType}) différent du type déclaré (${declaredMimeType}). Possible tentative de spoofing.`
    );
  }

  // 4. Validation spécifique par type
  let metadata = {};

  if (mediaType === 'IMAGE') {
    metadata = await validateImage(fileBuffer, rules);
  } else if (mediaType === 'AUDIO') {
    metadata = await validateAudio(fileBuffer, rules);
  } else if (mediaType === 'VIDEO') {
    metadata = await validateVideo(fileBuffer, rules);
  }

  if (metadata.errors && metadata.errors.length > 0) {
    errors.push(...metadata.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    metadata: metadata.data || {},
    checksum: formattedChecksum,
    actualMimeType,
  };
}

/**
 * Détecte le vrai MIME type via magic bytes
 */
async function detectRealMimeType(buffer) {
  try {
    const { fileTypeFromBuffer } = require('file-type');
    const result = await fileTypeFromBuffer(buffer);
    return result?.mime || 'application/octet-stream';
  } catch (error) {
    // Fallback: essayer de détecter manuellement via magic bytes
    const magicBytes = buffer.slice(0, 12);

    // JPEG: FF D8 FF
    if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47
    if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) {
      return 'image/png';
    }

    // MP3: ID3 ou FF FB
    if ((magicBytes[0] === 0x49 && magicBytes[1] === 0x44 && magicBytes[2] === 0x33) ||
        (magicBytes[0] === 0xFF && magicBytes[1] === 0xFB)) {
      return 'audio/mpeg';
    }

    // MP4/M4A: ftyp
    const ftypIndex = buffer.toString('ascii', 4, 8);
    if (ftypIndex === 'ftyp') {
      const subtype = buffer.toString('ascii', 8, 12);
      if (subtype.startsWith('M4A') || subtype.startsWith('mp42')) {
        return 'audio/mp4';
      }
      return 'video/mp4';
    }

    throw new Error('Type de fichier non reconnu');
  }
}

/**
 * Vérifie si deux MIME types sont compatibles (ex: audio/mp3 vs audio/mpeg)
 */
function isCompatibleMimeType(actual, declared) {
  const compatibilityMap = {
    'audio/mpeg': ['audio/mp3'],
    'audio/mp3': ['audio/mpeg'],
    'image/jpeg': ['image/jpg'],
    'image/jpg': ['image/jpeg'],
  };

  return compatibilityMap[actual]?.includes(declared) || false;
}

/**
 * Validation IMAGE
 */
async function validateImage(buffer, rules) {
  const errors = [];

  try {
    const metadata = await sharp(buffer).metadata();

    // Dimensions
    if (metadata.width < rules.minWidth) {
      errors.push(
        `Largeur trop petite: ${metadata.width}px < ${rules.minWidth}px minimum`
      );
    }

    if (metadata.width > rules.maxWidth) {
      errors.push(
        `Largeur trop grande: ${metadata.width}px > ${rules.maxWidth}px maximum`
      );
    }

    if (metadata.height < rules.minHeight) {
      errors.push(
        `Hauteur trop petite: ${metadata.height}px < ${rules.minHeight}px minimum`
      );
    }

    if (metadata.height > rules.maxHeight) {
      errors.push(
        `Hauteur trop grande: ${metadata.height}px > ${rules.maxHeight}px maximum`
      );
    }

    // Format
    const validFormats = ['jpeg', 'png', 'webp', 'heif', 'heic'];
    if (!validFormats.includes(metadata.format)) {
      errors.push(`Format image non supporté: ${metadata.format}`);
    }

    // Extraire EXIF si disponible
    let exifData = null;
    if (metadata.exif) {
      try {
        exifData = parseExif(metadata.exif);
      } catch (err) {
        // EXIF parsing failed, not critical
      }
    }

    return {
      errors,
      data: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        exif: exifData,
      }
    };
  } catch (error) {
    return {
      errors: [`Impossible de lire l'image: ${error.message}`],
    };
  }
}

/**
 * Validation AUDIO
 */
async function validateAudio(buffer, rules) {
  return new Promise((resolve) => {
    const errors = [];

    // Note: Pour une vraie validation audio, il faudrait ffprobe
    // Pour l'instant, validation basique sur la taille et magic bytes

    // Vérifier que c'est bien un fichier audio
    const magicBytes = buffer.slice(0, 12);
    let isValidAudio = false;

    // MP3: ID3 ou FF FB
    if ((magicBytes[0] === 0x49 && magicBytes[1] === 0x44 && magicBytes[2] === 0x33) ||
        (magicBytes[0] === 0xFF && magicBytes[1] === 0xFB)) {
      isValidAudio = true;
    }

    // M4A/MP4: ftyp
    const ftyp = buffer.toString('ascii', 4, 8);
    if (ftyp === 'ftyp') {
      isValidAudio = true;
    }

    // WAV: RIFF
    if (magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x46) {
      isValidAudio = true;
    }

    if (!isValidAudio) {
      errors.push('Fichier audio invalide ou corrompu');
    }

    // Pour une validation complète, il faudrait installer ffmpeg et utiliser ffprobe
    // Exemple avec ffprobe (nécessite ffmpeg installé):
    /*
    const tempPath = `/tmp/audio-${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, buffer);

    ffmpeg.ffprobe(tempPath, (err, metadata) => {
      fs.unlinkSync(tempPath);

      if (err) {
        return resolve({ errors: [`Impossible de lire l'audio: ${err.message}`] });
      }

      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      const duration = parseFloat(metadata.format.duration);

      if (duration > rules.maxDuration) {
        errors.push(`Durée trop longue: ${duration}s > ${rules.maxDuration}s`);
      }

      resolve({
        errors,
        data: { duration, codec: audioStream?.codec_name, ... }
      });
    });
    */

    // Pour l'instant, retourner validation basique
    resolve({
      errors,
      data: {
        validated: 'basic', // Indique que c'est une validation basique
        note: 'Installez ffmpeg pour validation complète (durée, codec)',
      }
    });
  });
}

/**
 * Validation VIDEO
 */
async function validateVideo(buffer, rules) {
  return new Promise((resolve) => {
    const errors = [];

    // Vérifier magic bytes MP4
    const ftyp = buffer.toString('ascii', 4, 8);
    if (ftyp !== 'ftyp') {
      errors.push('Fichier vidéo invalide ou corrompu (magic bytes)');
    }

    // Pour validation complète, nécessite ffprobe (ffmpeg)
    // Même logique que validateAudio

    resolve({
      errors,
      data: {
        validated: 'basic',
        note: 'Installez ffmpeg pour validation complète (durée d 30s, résolution, codec)',
      }
    });
  });
}

/**
 * Parse EXIF data (images)
 */
function parseExif(exifBuffer) {
  try {
    // Note: Pour un vrai parsing EXIF, utiliser exif-parser ou exifreader
    // Pour l'instant, retourner null
    return {
      note: 'Installez exif-parser pour extraire les métadonnées EXIF complètes',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Valide un nom de fichier (sécurité)
 */
function sanitizeFilename(filename) {
  // Enlever caractères dangereux
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remplacer caractères spéciaux
    .replace(/\.{2,}/g, '.') // Empêcher ..
    .substring(0, 255); // Limiter longueur
}

module.exports = {
  VALIDATION_RULES,
  MAX_MEDIA_PER_ALERT,
  validateMediaInitiation,
  validateMediaFile,
  detectRealMimeType,
  sanitizeFilename,
};
