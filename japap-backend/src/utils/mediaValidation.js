/**
 * Validation stricte des m�dias (images, audio, vid�o)
 * - Images: d 5 MB, formats autoris�s, dimensions
 * - Audio: d 5 MB, d 5 minutes, formats autoris�s
 * - Vid�o: d 5 MB, d 30 secondes STRICT, formats autoris�s
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

// Mapping MIME type � extensions attendues
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
 * Valide les m�tadonn�es d�clar�es par le client
 */
async function validateMediaInitiation(mediaData, prisma) {
  const { type, position, filename, mimeType, size, alertId } = mediaData;
  const errors = [];

  // 1. Type valide
  if (!['IMAGE', 'AUDIO', 'VIDEO'].includes(type)) {
    errors.push(`Type invalide: ${type}. Types autoris�s: IMAGE, AUDIO, VIDEO`);
    return { valid: false, errors };
  }

  const rules = VALIDATION_RULES[type];

  // 2. Taille d�clar�e
  if (size > rules.maxSize) {
    errors.push(
      `Fichier trop volumineux: ${(size / 1024 / 1024).toFixed(2)}MB > ${rules.maxSize / 1024 / 1024}MB maximum`
    );
  }

  // 3. MIME type
  if (!rules.allowedMimeTypes.includes(mimeType.toLowerCase())) {
    errors.push(
      `Format non autoris�: ${mimeType}. Formats autoris�s: ${rules.allowedMimeTypes.join(', ')}`
    );
  }

  // 4. Extension vs MIME (d�tection spoofing)
  const ext = path.extname(filename).toLowerCase();
  if (!rules.allowedExtensions.includes(ext)) {
    errors.push(
      `Extension non autoris�e: ${ext}. Extensions autoris�es: ${rules.allowedExtensions.join(', ')}`
    );
  }

  // V�rifier coh�rence MIME/extension
  if (MIME_EXTENSION_MAP[mimeType] && !MIME_EXTENSION_MAP[mimeType].includes(ext)) {
    errors.push(
      `Incoh�rence d�tect�e: MIME type "${mimeType}" ne correspond pas � l'extension "${ext}"`
    );
  }

  // 5. Position (images uniquement)
  if (type === 'IMAGE') {
    if (!position || position < 1 || position > 3) {
      errors.push('Position image doit �tre 1, 2 ou 3');
    }

    // V�rifier que position n'est pas d�j� occup�e
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
        errors.push(`Position ${position} d�j� occup�e pour cette alerte`);
      }
    }
  } else {
    // Audio/vid�o: position doit �tre null
    if (position !== null && position !== undefined) {
      errors.push(`${type} ne doit pas avoir de position (r�serv� aux images)`);
    }
  }

  // 6. Limite de m�dias par alerte
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
 * Validation Phase 2: Upload (pendant/apr�s upload)
 * Valide le fichier binaire r�el
 */
async function validateMediaFile(fileBuffer, mediaType, declaredMimeType, declaredChecksum = null) {
  const errors = [];
  const rules = VALIDATION_RULES[mediaType];

  // 1. Taille r�elle
  if (fileBuffer.length > rules.maxSize) {
    errors.push(
      `Taille r�elle d�passe la limite: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB > ${rules.maxSize / 1024 / 1024}MB`
    );
  }

  // 2. Checksum (int�grit�)
  const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const formattedChecksum = `sha256:${actualChecksum}`;

  if (declaredChecksum && formattedChecksum !== declaredChecksum) {
    errors.push('Checksum invalide: fichier corrompu ou alt�r� pendant le transfert');
  }

  // 3. Magic bytes (d�tection MIME r�el)
  let actualMimeType;
  try {
    actualMimeType = await detectRealMimeType(fileBuffer);
  } catch (error) {
    errors.push(`Impossible de d�tecter le type de fichier: ${error.message}`);
    return { valid: false, errors, checksum: formattedChecksum };
  }

  // V�rifier que le MIME d�clar� correspond au MIME r�el
  if (actualMimeType !== declaredMimeType && !isCompatibleMimeType(actualMimeType, declaredMimeType)) {
    errors.push(
      `Type r�el (${actualMimeType}) diff�rent du type d�clar� (${declaredMimeType}). Possible tentative de spoofing.`
    );
  }

  // 4. Validation sp�cifique par type
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
 * D�tecte le vrai MIME type via magic bytes
 */
async function detectRealMimeType(buffer) {
  try {
    const { fileTypeFromBuffer } = require('file-type');
    const result = await fileTypeFromBuffer(buffer);
    return result?.mime || 'application/octet-stream';
  } catch (error) {
    // Fallback: essayer de d�tecter manuellement via magic bytes
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
 * V�rifie si deux MIME types sont compatibles (ex: audio/mp3 vs audio/mpeg)
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
      errors.push(`Format image non support�: ${metadata.format}`);
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

    // V�rifier que c'est bien un fichier audio
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

    // Pour une validation compl�te, il faudrait installer ffmpeg et utiliser ffprobe
    // Exemple avec ffprobe (n�cessite ffmpeg install�):
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
        errors.push(`Dur�e trop longue: ${duration}s > ${rules.maxDuration}s`);
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
        note: 'Installez ffmpeg pour validation compl�te (dur�e, codec)',
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

    // V�rifier magic bytes MP4
    const ftyp = buffer.toString('ascii', 4, 8);
    if (ftyp !== 'ftyp') {
      errors.push('Fichier vid�o invalide ou corrompu (magic bytes)');
    }

    // Pour validation compl�te, n�cessite ffprobe (ffmpeg)
    // M�me logique que validateAudio

    resolve({
      errors,
      data: {
        validated: 'basic',
        note: 'Installez ffmpeg pour validation compl�te (dur�e d 30s, r�solution, codec)',
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
      note: 'Installez exif-parser pour extraire les m�tadonn�es EXIF compl�tes',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Valide un nom de fichier (s�curit�)
 */
function sanitizeFilename(filename) {
  // Enlever caract�res dangereux
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remplacer caract�res sp�ciaux
    .replace(/\.{2,}/g, '.') // Emp�cher ..
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
