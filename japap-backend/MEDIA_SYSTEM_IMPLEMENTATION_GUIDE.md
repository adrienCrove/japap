# 📚 Guide d'Implémentation - Système Media Unifié

## 🎯 Vue d'ensemble

Ce guide documente l'implémentation complète d'un système de gestion de médias robuste pour JAPAP, supportant:
- **Images**: 3 max par alerte, ≤ 5 MB chacune
- **Audio**: 1 max par alerte, ≤ 5 MB, ≤ 5 minutes, avec transcription auto + corrections humaines
- **Vidéo**: 1 max par alerte, ≤ 5 MB, ≤ 30 secondes STRICT

---

## ✅ Phase 1: Validation Core (TERMINÉ)

### Fichiers créés:

#### 1. `src/utils/mediaValidation.js`
**Fonctionnalités:**
- ✅ Constantes de validation (VALIDATION_RULES, MAX_MEDIA_PER_ALERT)
- ✅ `validateMediaInitiation()` - Validation avant upload (taille, MIME, extension, position, limites)
- ✅ `validateMediaFile()` - Validation fichier binaire (checksum, magic bytes, dimensions)
- ✅ `detectRealMimeType()` - Détection MIME réel via magic bytes (anti-spoofing)
- ✅ `validateImage()` - Validation spécifique images (dimensions, format)
- ✅ `validateAudio()` - Validation basique audio (magic bytes)
- ✅ `validateVideo()` - Validation basique vidéo (magic bytes)
- ✅ `sanitizeFilename()` - Sécurisation noms de fichiers

**Règles implémentées:**
```javascript
IMAGE: {
  maxSize: 5 MB,
  formats: [jpeg, jpg, png, webp, heic, heif],
  dimensions: 100x100 min, 4096x4096 max
}

AUDIO: {
  maxSize: 5 MB,
  formats: [mp3, wav, m4a, ogg, webm],
  durée: 1s min, 300s (5min) max
}

VIDEO: {
  maxSize: 5 MB,
  formats: [mp4, mov, avi, webm],
  durée: 1s min, 30s max STRICT,
  résolution: 1920x1080 max
}
```

**Notes:**
- ⚠️ Validation audio/vidéo complète nécessite `ffmpeg` + `ffprobe` (durée, codec)
- ⚠️ EXIF parsing complet nécessite `exif-parser` package
- ✅ Fallback sur magic bytes pour validation basique

#### 2. `src/middleware/uploadMiddleware.js`
**Fonctionnalités:**
- ✅ `createUploadMiddleware(mediaType)` - Factory Multer par type
- ✅ `uploadImage` - Middleware pour images (max 5MB)
- ✅ `uploadAudio` - Middleware pour audio (max 5MB)
- ✅ `uploadVideo` - Middleware pour vidéo (max 5MB)
- ✅ `uploadMultipleImages` - Middleware pour 3 images max
- ✅ `handleMulterError()` - Gestionnaire erreurs avec codes clairs

**Configuration Multer:**
- Storage: `memoryStorage()` (validation avant écriture disque)
- Limits: 5MB max, 1 fichier à la fois (ou 3 pour multi-images)
- FileFilter: Validation MIME + extension avant traitement

---

## 📋 Phase 2: Schéma Prisma (DOCUMENTÉ)

### Fichier créé: `MEDIA_SCHEMA_NEW.md`

**Nouveaux models:**

#### `Media` (parent unifié)
- Type: IMAGE | AUDIO | VIDEO
- Position: 1-3 pour images, null pour audio/vidéo
- Relations: Alert, User (owner), User (uploader)
- Stockage: filename, path, url, size, mimeType
- Intégrité: checksum SHA-256, capturedAt (client), receivedAt (serveur)
- Métadonnées: JSON flexible (EXIF, codec, etc.)
- Dimensions: width, height (images/vidéos)
- Durée: duration en secondes (audio/vidéos)
- Upload workflow: uploadStatus, uploadToken, uploadExpiry, uploadError
- AI Enhancement: isEnhanced, originalMediaId, enhancedVersions

#### `MediaDerivative` (thumbnails, previews)
- Types: THUMBNAIL (150x150), MEDIUM (800x600), LARGE (1920x1080), PREVIEW (vidéo 10s), WAVEFORM (audio SVG)
- Relation: Media parent
- Métadonnées: generatedBy (sharp/ffmpeg/cloudinary), params génération

#### `Transcription` (versionnée)
- Relation: Media (audio uniquement)
- Version: 1, 2, 3... (auto-incrémenté)
- Source: AUTO (Whisper) | HUMAN_CORRECTED | MANUAL
- isActive: Une seule version active (priorité HUMAN > AUTO)
- Métadonnées: word timestamps, alternatives, confidence

**Modifications models existants:**

#### `Alert`
- ❌ Supprimer: `mediaUrl`, `images`
- ✅ Ajouter: `media Media[]`, `imageCount`, `hasAudio`, `hasVideo`

#### `User`
- ❌ Supprimer: `images`, `uploadedImages`
- ✅ Ajouter: `ownedMedia Media[]`, `uploadedMedia Media[]`, `transcriptions Transcription[]`

**Enums:**
- `MediaType`: IMAGE | AUDIO | VIDEO
- `UploadStatus`: PENDING | UPLOADING | PROCESSING | COMPLETED | FAILED
- `DerivativeType`: THUMBNAIL | MEDIUM | LARGE | PREVIEW | WAVEFORM
- `TranscriptionSource`: AUTO | HUMAN_CORRECTED | MANUAL

**Contraintes:**
- ✅ `@@unique([alertId, type, position])` - Empêche doublons position
- ✅ `@@index([checksum])` - Détection doublons fichiers

---

## 🔄 Phase 3: Migration (À FAIRE)

### Étapes:

1. **Ajouter nouveaux models au schema.prisma**
   ```bash
   # Copier le contenu de MEDIA_SCHEMA_NEW.md dans prisma/schema.prisma
   ```

2. **Créer la migration**
   ```bash
   cd japap-backend
   npx prisma migrate dev --name add_unified_media_system
   ```

3. **Script de migration des données** (à créer: `migrations/xxx_migrate_image_to_media.sql`)
   ```sql
   -- 1. Migrer Image → Media
   INSERT INTO "Media" (
     id, type, alertId, userId, uploadedBy, filename, originalName,
     path, url, size, mimeType, width, height, isEnhanced, originalMediaId,
     enhancementMetadata, receivedAt, createdAt, updatedAt, uploadStatus, checksum
   )
   SELECT
     id,
     'IMAGE',
     "alertId",
     "userId",
     "uploadedBy",
     filename,
     "originalName",
     path,
     url,
     size,
     "mimeType",
     width,
     height,
     "isEnhanced",
     "originalImageId",
     "enhancementMetadata",
     "createdAt", -- receivedAt = createdAt
     "createdAt",
     "updatedAt",
     'COMPLETED', -- Anciennes images = complétées
     'sha256:' || MD5(path) -- Générer checksum basique
   FROM "Image";

   -- 2. Assigner positions aux images (1, 2, 3)
   WITH ranked AS (
     SELECT id, ROW_NUMBER() OVER (PARTITION BY "alertId" ORDER BY "createdAt") as rn
     FROM "Media"
     WHERE type = 'IMAGE' AND "alertId" IS NOT NULL
   )
   UPDATE "Media" m
   SET position = r.rn
   FROM ranked r
   WHERE m.id = r.id AND r.rn <= 3;

   -- 3. Supprimer images au-delà de position 3
   DELETE FROM "Media"
   WHERE type = 'IMAGE' AND "alertId" IS NOT NULL AND position > 3;
   ```

4. **Tester la migration**
   ```bash
   # Vérifier que toutes les images ont été migrées
   SELECT COUNT(*) FROM "Image"; -- Devrait être > 0 avant
   SELECT COUNT(*) FROM "Media" WHERE type = 'IMAGE'; -- Devrait être égal après
   ```

5. **Supprimer ancien model Image** (migration séparée)
   ```bash
   # Après vérification que tout fonctionne
   npx prisma migrate dev --name remove_image_model
   ```

---

## 🌐 Phase 4: API Endpoints (À FAIRE)

### Fichiers à créer:

#### 1. `src/controllers/mediaController.js`

**Endpoints:**

```javascript
// POST /api/alerts/:alertId/media/initiate
exports.initiateMediaUpload = async (req, res) => {
  // 1. Valider metadata déclarées (validateMediaInitiation)
  // 2. Générer mediaId
  // 3. Créer enregistrement Media avec uploadStatus = PENDING
  // 4. Générer uploadToken JWT (exp 5min)
  // 5. Retourner { mediaId, uploadUrl, uploadToken, expiresAt }
};

// PUT /api/uploads/presigned/:mediaId
exports.uploadMediaFile = async (req, res) => {
  // 1. Vérifier uploadToken
  // 2. Récupérer req.file.buffer
  // 3. Valider fichier binaire (validateMediaFile)
  // 4. Calculer checksum
  // 5. Sauvegarder dans /uploads/alerts/{alertId}/media/{mediaId}/original.{ext}
  // 6. Mettre à jour Media (uploadStatus = PROCESSING, checksum, metadata)
  // 7. Retourner success
};

// POST /api/alerts/:alertId/media/:mediaId/complete
exports.completeMediaUpload = async (req, res) => {
  // 1. Vérifier uploadStatus = PROCESSING
  // 2. Mettre à jour Alert stats (imageCount++, hasAudio=true)
  // 3. Enqueue jobs asynchrones (Bull):
  //    - IMAGE: generate-thumbnails, ai-enhancement (si DISP/DECD)
  //    - AUDIO: transcribe-audio, generate-waveform
  //    - VIDEO: generate-preview, generate-thumbnail
  // 4. uploadStatus = COMPLETED
  // 5. Retourner media avec jobsQueued
};

// GET /api/alerts/:alertId/media
exports.getAlertMedia = async (req, res) => {
  // Lister tous les médias de l'alerte avec dérivés et transcriptions
};

// DELETE /api/alerts/:alertId/media/:mediaId
exports.deleteMedia = async (req, res) => {
  // Supprimer fichiers + enregistrements
};

// POST /api/media/:mediaId/transcription
exports.addTranscriptionCorrection = async (req, res) => {
  // Ajouter version corrigée, incrementer version, set isActive=true
};

// GET /api/media/:mediaId/transcription/best
exports.getBestTranscription = async (req, res) => {
  // Retourner transcription active (priorité HUMAN > AUTO)
};
```

#### 2. `src/routes/media.js`

```javascript
const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { uploadImage, handleMulterError } = require('../middleware/uploadMiddleware');

// Initiate upload
router.post('/alerts/:alertId/media/initiate', mediaController.initiateMediaUpload);

// Upload binaire (avec multer dynamique selon type)
router.put('/uploads/presigned/:mediaId', uploadImage, handleMulterError, mediaController.uploadMediaFile);

// Complete upload
router.post('/alerts/:alertId/media/:mediaId/complete', mediaController.completeMediaUpload);

// List media
router.get('/alerts/:alertId/media', mediaController.getAlertMedia);

// Delete media
router.delete('/alerts/:alertId/media/:mediaId', mediaController.deleteMedia);

// Transcriptions
router.post('/media/:mediaId/transcription', mediaController.addTranscriptionCorrection);
router.get('/media/:mediaId/transcription/best', mediaController.getBestTranscription);

module.exports = router;
```

#### 3. Modifier `src/index.js`

```javascript
const mediaRoutes = require('./routes/media');
app.use('/api', mediaRoutes);
```

---

## 📁 Phase 5: Structure de Stockage (À FAIRE)

### Modifier `src/utils/fileUtils.js`

**Nouvelle fonction:**

```javascript
/**
 * Sauvegarde un média dans /uploads/alerts/{alertId}/media/{mediaId}/
 */
async function saveMedia(fileBuffer, alertId, mediaId, originalFilename, mediaType) {
  // 1. Créer structure: /uploads/alerts/{alertId}/media/{mediaId}/
  const alertDir = path.join(process.cwd(), 'public', 'uploads', 'alerts', alertId, 'media', mediaId);
  await fs.mkdir(alertDir, { recursive: true });

  // 2. Déterminer extension
  const ext = path.extname(originalFilename);

  // 3. Sauvegarder original
  const filename = `original${ext}`;
  const filePath = path.join(alertDir, filename);
  await fs.writeFile(filePath, fileBuffer);

  // 4. Générer URL
  const relativePath = `/uploads/alerts/${alertId}/media/${mediaId}/${filename}`;

  return {
    filename,
    path: relativePath,
    absolutePath: filePath,
    size: fileBuffer.length,
  };
}
```

**Structure finale:**
```
/uploads/alerts/{alertId}/media/
├── {mediaId-1}/                 # Photo 1
│   ├── original.jpg
│   ├── thumbnail.jpg            # Généré par job async
│   ├── medium.jpg
│   └── enhanced.jpg             # Si DISP/DECD
├── {mediaId-2}/                 # Photo 2
│   └── original.png
├── {mediaId-3}/                 # Photo 3
│   └── original.jpg
├── {mediaId-4}/                 # Audio
│   ├── original.mp3
│   └── waveform.svg
└── {mediaId-5}/                 # Vidéo
    ├── original.mp4
    ├── preview.mp4
    └── thumbnail.jpg
```

---

## ⚙️ Phase 6: Jobs Asynchrones (À FAIRE)

### Installer Bull + Redis

```bash
cd japap-backend
npm install bull redis
```

### Créer `src/jobs/mediaProcessor.js`

```javascript
const Queue = require('bull');
const sharp = require('sharp');
const { enhancePortrait } = require('../services/imageEnhancementService');

const mediaQueue = new Queue('media-processing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Job: Thumbnails images
mediaQueue.process('generate-thumbnails', async (job) => {
  const { mediaId } = job.data;
  // 1. Load Media
  // 2. Generate thumbnail 150x150
  // 3. Generate medium 800x600
  // 4. Save MediaDerivative records
});

// Job: AI Enhancement (DISP/DECD)
mediaQueue.process('ai-enhancement', async (job) => {
  const { mediaId } = job.data;
  // 1. Call enhancePortrait()
  // 2. Create new Media with isEnhanced=true
});

// Job: Transcription audio (OpenAI Whisper)
mediaQueue.process('transcribe-audio', async (job) => {
  const { mediaId } = job.data;
  // 1. Call OpenAI Whisper API
  // 2. Create Transcription (version=1, source=AUTO, isActive=true)
});

module.exports = mediaQueue;
```

---

## 📱 Phase 7: Mobile App (À FAIRE)

### Fichiers à créer:

#### 1. `japap/utils/mediaValidation.ts`

```typescript
export const MEDIA_VALIDATION_RULES = {
  IMAGE: { maxSize: 5 * 1024 * 1024, maxCount: 3 },
  AUDIO: { maxSize: 5 * 1024 * 1024, maxDuration: 300 },
  VIDEO: { maxSize: 5 * 1024 * 1024, maxDuration: 30 },
};

export async function validateImage(uri: string, size: number): Promise<ValidationResult> {
  // Validation côté client avant upload
}
```

#### 2. Modifier `japap/components/AlertDetailFormModal.tsx`

**Changements:**
- ❌ `imageUri: string | null` → ✅ `imageUris: string[]` (max 3)
- ✅ UI: 3 emplacements pour images avec boutons "+" et "X"
- ✅ Validation avant upload
- ✅ Upload séquentiel: initiate → upload → complete pour chaque image

**UI proposée:**
```
[Photo 1]  [Photo 2]  [Photo 3]
   +          +          +

// Après ajout:
[Image 1]  [Image 2]  [  +  ]
   X          X
```

---

## 🔧 Phase 8: Installation Dependencies (À FAIRE)

### Backend

```bash
cd japap-backend

# Validation
npm install file-type@16.5.4  # Détection MIME via magic bytes
npm install sharp              # Manipulation images (thumbnails, metadata)

# Jobs asynchrones
npm install bull redis

# Audio/Vidéo (optionnel, nécessite ffmpeg installé)
npm install fluent-ffmpeg
# Installer ffmpeg système: https://ffmpeg.org/download.html

# EXIF parsing (optionnel)
npm install exif-parser
```

### Mobile

```bash
cd japap

# Validation + checksum
npm install expo-file-system  # Checksum SHA-256
npm install expo-av            # Durée audio/vidéo
```

---

## ✅ Checklist d'Implémentation

### Phase 1: Validation Core ✅
- [x] Créer `mediaValidation.js`
- [x] Créer `uploadMiddleware.js`

### Phase 2: Schéma Prisma 🔄
- [x] Documenter nouveau schéma
- [ ] Intégrer dans `schema.prisma`
- [ ] Créer migration
- [ ] Script migration données
- [ ] Tester migration
- [ ] Supprimer ancien model Image

### Phase 3: API Endpoints ⏳
- [ ] Créer `mediaController.js`
- [ ] Créer `routes/media.js`
- [ ] Modifier `fileUtils.js` (saveMedia)
- [ ] Router dans `index.js`
- [ ] Tests API (Postman/Thunder Client)

### Phase 4: Jobs Asynchrones ⏳
- [ ] Installer Bull + Redis
- [ ] Créer `jobs/mediaProcessor.js`
- [ ] Job: generate-thumbnails
- [ ] Job: ai-enhancement
- [ ] Job: transcribe-audio
- [ ] Job: generate-waveform
- [ ] Job: generate-video-preview

### Phase 5: Mobile App ⏳
- [ ] Créer `utils/mediaValidation.ts`
- [ ] Modifier `AlertDetailFormModal` (multi-images)
- [ ] UI: 3 emplacements photos
- [ ] Upload workflow: initiate → upload → complete
- [ ] Progress bars
- [ ] Compression si > 5MB

### Phase 6: Tests End-to-End ⏳
- [ ] Test upload 3 images
- [ ] Test upload audio + transcription
- [ ] Test upload vidéo 30s
- [ ] Test validation (rejet fichiers invalides)
- [ ] Test enhancement IA (DISP/DECD)
- [ ] Test transcription correction humaine

---

## 📊 État Actuel

**Terminé:** 20%
- ✅ Validation core (mediaValidation.js, uploadMiddleware.js)
- ✅ Documentation schéma Prisma

**En cours:** 0%

**À faire:** 80%
- Migration Prisma
- API endpoints
- Jobs asynchrones
- Mobile app
- Tests

---

## 🚀 Prochaines Étapes Recommandées

1. **Installer dependencies backend**
   ```bash
   cd japap-backend
   npm install file-type sharp bull redis
   ```

2. **Intégrer nouveau schéma Prisma**
   - Copier contenu de `MEDIA_SCHEMA_NEW.md` dans `schema.prisma`
   - Exécuter migration

3. **Créer mediaController et routes**
   - Implémenter endpoints initiate/upload/complete

4. **Tester workflow upload complet**
   - Postman: POST /initiate → PUT /upload → POST /complete

5. **Implémenter mobile multi-images**
   - Modifier AlertDetailFormModal

---

## 📞 Support

Pour toute question sur cette implémentation:
1. Consulter ce guide
2. Vérifier `MEDIA_SCHEMA_NEW.md` pour le schéma
3. Vérifier `mediaValidation.js` pour les règles de validation
