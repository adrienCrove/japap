# 🧪 Tests API - Système Media Unifié

Guide de test des endpoints avec exemples cURL, Postman, et Thunder Client.

---

## 📋 Prérequis

1. **Backend démarré:**
   ```bash
   cd japap-backend
   npm run dev
   # Serveur: http://localhost:4000
   ```

2. **Base de données:**
   - PostgreSQL en cours d'exécution
   - Schéma Prisma à jour (`npx prisma db push`)

3. **Alerte de test:**
   - Créer une alerte pour les tests (noter l'ID)

---

## 🔄 Workflow Complet: Upload d'une Image

### Étape 1: Initiate Upload (Réserver slot)

**Endpoint:** `POST /api/alerts/:alertId/media/initiate`

**Request:**
```bash
curl -X POST http://localhost:4000/api/alerts/YOUR_ALERT_ID/media/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "IMAGE",
    "position": 1,
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048000,
    "checksum": "sha256:abc123...",
    "capturedAt": "2025-01-20T14:30:00Z",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "camera": "iPhone 14 Pro"
    }
  }'
```

**Response Success (200):**
```json
{
  "success": true,
  "mediaId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadUrl": "/api/uploads/presigned/550e8400-e29b-41d4-a716-446655440000",
  "uploadToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-20T14:35:00.000Z",
  "message": "Slot réservé. Uploadez le fichier avant 14:35:00"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "errors": [
    "Fichier trop volumineux: 8.5MB > 5MB maximum",
    "Position 1 déjà occupée pour cette alerte"
  ]
}
```

---

### Étape 2: Upload Binary File

**Endpoint:** `PUT /api/uploads/presigned/:mediaId`

**Request (cURL):**
```bash
curl -X PUT http://localhost:4000/api/uploads/presigned/MEDIA_ID \
  -H "Authorization: Bearer YOUR_UPLOAD_TOKEN" \
  -H "X-Checksum: sha256:abc123..." \
  -F "file=@/path/to/photo.jpg"
```

**Request (Postman):**
1. Method: `PUT`
2. URL: `http://localhost:4000/api/uploads/presigned/{{mediaId}}`
3. Headers:
   - `Authorization`: `Bearer {{uploadToken}}`
   - `X-Checksum`: `sha256:abc123...`
4. Body → form-data:
   - Key: `file` (type: File)
   - Value: Sélectionner fichier

**Response Success (200):**
```json
{
  "success": true,
  "mediaId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadStatus": "PROCESSING",
  "message": "Upload terminé. Finalisez avec /complete pour générer les dérivés.",
  "media": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "IMAGE",
    "url": "/uploads/alerts/alert-123/media/550e8400.../original.jpg",
    "size": 2048000,
    "checksum": "sha256:abc123...",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "actualMimeType": "image/jpeg"
    }
  }
}
```

**Response Error (400 - Validation):**
```json
{
  "success": false,
  "errors": [
    "Largeur trop grande: 5000px > 4096px maximum",
    "Type réel (image/png) différent du type déclaré (image/jpeg). Possible tentative de spoofing."
  ]
}
```

**Response Error (401 - Token):**
```json
{
  "success": false,
  "error": "Token d'upload expiré. Veuillez réinitier l'upload."
}
```

---

### Étape 3: Complete Upload (Déclencher jobs)

**Endpoint:** `POST /api/alerts/:alertId/media/:mediaId/complete`

**Request:**
```bash
curl -X POST http://localhost:4000/api/alerts/ALERT_ID/media/MEDIA_ID/complete \
  -H "Content-Type: application/json"
```

**Response Success (200):**
```json
{
  "success": true,
  "mediaId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadStatus": "COMPLETED",
  "jobsQueued": ["generate-thumbnails", "ai-enhancement"],
  "message": "Upload finalisé. Les dérivés seront générés en arrière-plan.",
  "media": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "IMAGE",
    "position": 1,
    "url": "/uploads/alerts/alert-123/media/550e8400.../original.jpg",
    "size": 2048000,
    "checksum": "sha256:abc123..."
  }
}
```

---

## 📸 Tests par Type de Média

### IMAGE (3 max par alerte)

**Validation:**
- Taille: ≤ 5 MB
- Formats: JPEG, PNG, WebP, HEIC
- Dimensions: 100x100 min, 4096x4096 max
- Position: 1, 2, ou 3

**Exemple 1: Image valide**
```json
{
  "type": "IMAGE",
  "position": 1,
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 2048000
}
```
✅ Devrait réussir

**Exemple 2: Image trop volumineuse**
```json
{
  "type": "IMAGE",
  "position": 1,
  "filename": "huge.jpg",
  "mimeType": "image/jpeg",
  "size": 8000000
}
```
❌ Erreur: "Fichier trop volumineux: 8.0MB > 5MB maximum"

**Exemple 3: Position déjà occupée**
```json
{
  "type": "IMAGE",
  "position": 1,
  "filename": "photo2.jpg",
  "mimeType": "image/jpeg",
  "size": 1500000
}
```
❌ Erreur: "Position 1 déjà occupée pour cette alerte"

**Exemple 4: Plus de 3 images**
```json
{
  "type": "IMAGE",
  "position": 4,
  "filename": "photo4.jpg",
  "mimeType": "image/jpeg",
  "size": 1500000
}
```
❌ Erreur: "Maximum 3 image(s) par alerte atteint"

---

### AUDIO (1 max par alerte)

**Validation:**
- Taille: ≤ 5 MB
- Formats: MP3, WAV, M4A, OGG, WebM
- Durée: ≤ 5 minutes (validation complète nécessite ffmpeg)
- Position: null

**Exemple 1: Audio valide**
```json
{
  "type": "AUDIO",
  "filename": "recording.mp3",
  "mimeType": "audio/mpeg",
  "size": 3500000,
  "metadata": {
    "duration": 180
  }
}
```
✅ Devrait réussir

**Exemple 2: Audio trop volumineux**
```json
{
  "type": "AUDIO",
  "filename": "long.mp3",
  "mimeType": "audio/mpeg",
  "size": 7000000
}
```
❌ Erreur: "Fichier trop volumineux: 7.0MB > 5MB maximum"

---

### VIDEO (1 max par alerte)

**Validation:**
- Taille: ≤ 5 MB
- Formats: MP4, MOV, AVI, WebM
- Durée: ≤ 30 secondes STRICT (validation complète nécessite ffmpeg)
- Résolution: ≤ 1920x1080
- Position: null

**Exemple 1: Vidéo valide**
```json
{
  "type": "VIDEO",
  "filename": "clip.mp4",
  "mimeType": "video/mp4",
  "size": 4500000,
  "metadata": {
    "duration": 25,
    "width": 1920,
    "height": 1080
  }
}
```
✅ Devrait réussir

**Exemple 2: Vidéo trop longue**
```json
{
  "type": "VIDEO",
  "filename": "long_clip.mp4",
  "mimeType": "video/mp4",
  "size": 4000000,
  "metadata": {
    "duration": 45
  }
}
```
❌ Erreur: "Durée vidéo trop longue: 45s > 30s (MAX STRICT)"

---

## 📚 Autres Endpoints

### Lister les médias d'une alerte

**Endpoint:** `GET /api/alerts/:alertId/media`

**Request:**
```bash
curl http://localhost:4000/api/alerts/ALERT_ID/media
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "media-1",
      "type": "IMAGE",
      "position": 1,
      "url": "/uploads/alerts/alert-123/media/media-1/original.jpg",
      "size": 2048000,
      "checksum": "sha256:abc...",
      "derivatives": [
        {
          "id": "deriv-1",
          "derivativeType": "THUMBNAIL",
          "url": "/uploads/alerts/alert-123/media/media-1/thumbnail.jpg",
          "size": 15000
        },
        {
          "id": "deriv-2",
          "derivativeType": "MEDIUM",
          "url": "/uploads/alerts/alert-123/media/media-1/medium.jpg",
          "size": 120000
        }
      ],
      "transcriptions": []
    },
    {
      "id": "media-2",
      "type": "AUDIO",
      "position": null,
      "url": "/uploads/alerts/alert-123/media/media-2/original.mp3",
      "duration": 180,
      "transcriptions": [
        {
          "id": "trans-1",
          "text": "Ma copine a disparu hier soir...",
          "source": "HUMAN_CORRECTED",
          "version": 2,
          "isActive": true
        }
      ]
    }
  ]
}
```

---

### Supprimer un média

**Endpoint:** `DELETE /api/alerts/:alertId/media/:mediaId`

**Request:**
```bash
curl -X DELETE http://localhost:4000/api/alerts/ALERT_ID/media/MEDIA_ID
```

**Response:**
```json
{
  "success": true,
  "message": "Média supprimé avec succès"
}
```

---

### Ajouter correction transcription

**Endpoint:** `POST /api/media/:mediaId/transcription`

**Request:**
```bash
curl -X POST http://localhost:4000/api/media/MEDIA_ID/transcription \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Ma copine a disparu hier soir vers 22h à Cocody",
    "language": "fr",
    "createdBy": "user-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "transcription": {
    "id": "trans-2",
    "mediaId": "media-2",
    "text": "Ma copine a disparu hier soir vers 22h à Cocody",
    "language": "fr",
    "version": 2,
    "source": "HUMAN_CORRECTED",
    "isActive": true,
    "createdBy": "user-123"
  },
  "message": "Transcription v2 activée"
}
```

---

### Récupérer meilleure transcription

**Endpoint:** `GET /api/media/:mediaId/transcription/best`

**Request:**
```bash
curl http://localhost:4000/api/media/MEDIA_ID/transcription/best
```

**Response:**
```json
{
  "success": true,
  "transcription": {
    "id": "trans-2",
    "text": "Ma copine a disparu hier soir vers 22h à Cocody",
    "source": "HUMAN_CORRECTED",
    "version": 2,
    "confidence": null,
    "isActive": true
  }
}
```

---

## 🧪 Scénarios de Test Complets

### Scénario 1: Upload 3 images pour une alerte DISP

```bash
# Alerte DISP (Disparition) - ID: alert-disp-001

# Image 1
curl -X POST http://localhost:4000/api/alerts/alert-disp-001/media/initiate \
  -H "Content-Type: application/json" \
  -d '{"type":"IMAGE","position":1,"filename":"photo1.jpg","mimeType":"image/jpeg","size":2000000}'

# Récupérer mediaId et uploadToken
# Puis upload fichier...
curl -X PUT http://localhost:4000/api/uploads/presigned/MEDIA_ID_1 \
  -H "Authorization: Bearer TOKEN_1" \
  -F "file=@photo1.jpg"

# Complete
curl -X POST http://localhost:4000/api/alerts/alert-disp-001/media/MEDIA_ID_1/complete

# Répéter pour Image 2 et 3...
```

**Résultat attendu:**
- ✅ 3 images uploadées (positions 1, 2, 3)
- ✅ Jobs queued: generate-thumbnails, ai-enhancement (DISP)
- ✅ Alert.imageCount = 3

---

### Scénario 2: Upload audio avec transcription

```bash
# Upload audio
curl -X POST http://localhost:4000/api/alerts/ALERT_ID/media/initiate \
  -H "Content-Type: application/json" \
  -d '{"type":"AUDIO","filename":"audio.mp3","mimeType":"audio/mpeg","size":3500000}'

# Upload fichier
curl -X PUT http://localhost:4000/api/uploads/presigned/MEDIA_ID \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@audio.mp3"

# Complete
curl -X POST http://localhost:4000/api/alerts/ALERT_ID/media/MEDIA_ID/complete

# (Attendre transcription auto par job async)

# Corriger transcription
curl -X POST http://localhost:4000/api/media/MEDIA_ID/transcription \
  -H "Content-Type: application/json" \
  -d '{"text":"Transcription corrigée...","createdBy":"user-123"}'
```

**Résultat attendu:**
- ✅ Audio uploadé
- ✅ Jobs queued: transcribe-audio, generate-waveform
- ✅ Alert.hasAudio = true
- ✅ Transcription v1 (AUTO) → v2 (HUMAN_CORRECTED) active

---

## 🔍 Validation & Sécurité

### Anti-Spoofing (Magic Bytes)

**Test 1: Fichier PNG déguisé en JPEG**
```bash
# Renommer test.png en test.jpg
# Déclarer mimeType: "image/jpeg"
```
❌ **Résultat attendu:**
```json
{
  "success": false,
  "errors": [
    "Type réel (image/png) différent du type déclaré (image/jpeg)"
  ]
}
```

### Checksum Integrity

**Test 2: Fichier corrompu**
```bash
# Calculer checksum: sha256:abc123
# Modifier fichier avant upload
# Envoyer avec ancien checksum
```
❌ **Résultat attendu:**
```json
{
  "success": false,
  "errors": [
    "Checksum invalide: fichier corrompu ou altéré pendant le transfert"
  ]
}
```

---

## 📊 Collection Postman

Importer cette collection JSON:

```json
{
  "info": {
    "name": "JAPAP Media API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:4000/api"},
    {"key": "alertId", "value": ""},
    {"key": "mediaId", "value": ""},
    {"key": "uploadToken", "value": ""}
  ],
  "item": [
    {
      "name": "1. Initiate Upload",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/alerts/{{alertId}}/media/initiate",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"type\": \"IMAGE\",\n  \"position\": 1,\n  \"filename\": \"photo.jpg\",\n  \"mimeType\": \"image/jpeg\",\n  \"size\": 2048000\n}"
        }
      }
    }
  ]
}
```

---

## 🚀 Automatisation Tests

### Script Node.js

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testImageUpload(alertId, imagePath) {
  const baseUrl = 'http://localhost:4000/api';

  // Step 1: Initiate
  const initResponse = await axios.post(
    `${baseUrl}/alerts/${alertId}/media/initiate`,
    {
      type: 'IMAGE',
      position: 1,
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: fs.statSync(imagePath).size
    }
  );

  const { mediaId, uploadToken } = initResponse.data;
  console.log('✅ Slot reserved:', mediaId);

  // Step 2: Upload
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));

  const uploadResponse = await axios.put(
    `${baseUrl}/uploads/presigned/${mediaId}`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${uploadToken}`
      }
    }
  );

  console.log('✅ File uploaded:', uploadResponse.data.media.url);

  // Step 3: Complete
  const completeResponse = await axios.post(
    `${baseUrl}/alerts/${alertId}/media/${mediaId}/complete`
  );

  console.log('✅ Upload completed. Jobs:', completeResponse.data.jobsQueued);
}

// Run
testImageUpload('your-alert-id', './test-image.jpg');
```

---

**Date:** 2025-01-20
**Version API:** 1.0
**Base URL:** http://localhost:4000/api
