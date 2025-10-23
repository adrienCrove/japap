# 🔄 Guide des Jobs Asynchrones - Système Media

## Vue d'ensemble

Le système de traitement asynchrone utilise **Bull** (file d'attente basée sur Redis) pour traiter les médias en arrière-plan après upload.

---

## 📋 Architecture

```
Client → API Upload → Media Controller → Bull Queue → Job Processors → Database
                                              ↓
                                         Redis Server
```

### Composants

1. **Bull Queue** (`mediaQueue`): File d'attente unique pour tous les jobs media
2. **Redis**: Stockage persistant des jobs
3. **Job Processors**: Fonctions qui exécutent le traitement
4. **Prisma**: Enregistrement des résultats en DB

---

## 🎯 Jobs Implémentés

### 1. **generate-thumbnails** (Images)

**Déclenché**: Automatiquement après upload d'une IMAGE
**Priorité**: 5 (haute)
**Données**: `{ mediaId }`

**Actions**:
- Génère 3 tailles de miniatures avec Sharp:
  - `THUMBNAIL`: 150x150px (cover)
  - `MEDIUM`: 800x600px (inside)
  - `LARGE`: 1920x1080px (inside)
- Crée des `MediaDerivative` records en DB
- Sauvegarde dans `/uploads/alerts/{alertId}/media/{mediaId}/{mediaId}-{type}.jpg`

**Durée moyenne**: 2-5 secondes

---

### 2. **ai-enhancement** (Images DISP/DECD)

**Déclenché**: Automatiquement pour catégories DISP (Disparition) et DECD (Décès)
**Priorité**: 10 (normale)
**Données**: `{ mediaId, alertId, categoryCode }`

**Actions**:
- Lit l'image originale
- Convertit en base64
- Appelle Gemini 2.5 Flash Image API
- Reçoit image améliorée (meilleure qualité portrait)
- Crée un nouveau `Media` record avec `isEnhanced: true`
- Sauvegarde dans `/uploads/alerts/{alertId}/media/{mediaId}/{mediaId}-enhanced.jpg`

**Durée moyenne**: 5-15 secondes
**Coût**: ~$0.001 par image (selon config Vertex AI)

**Configuration**:
```javascript
// src/config/vertexai.js
IMAGE_ENHANCEMENT_CONFIG = {
  enhancementCategories: ['DISP', 'DECD'],
  prompts: {
    portraitEnhancement: "Enhance this portrait photo..."
  }
}
```

---

### 3. **transcribe-audio** (Audio)

**Déclenché**: Automatiquement après upload d'un AUDIO
**Priorité**: 5 (haute)
**Données**: `{ mediaId }`

**Actions**:
- Lit le fichier audio
- Appelle OpenAI Whisper API (`whisper-1`)
- Crée un `Transcription` record:
  - `version: 1`
  - `source: AUTO`
  - `isActive: true`
- Stocke le texte transcrit et métadonnées

**Durée moyenne**: 10-30 secondes (selon durée audio)
**Coût**: ~$0.006 par minute audio

**Prérequis**:
```bash
# .env
OPENAI_API_KEY=sk-...
```

---

### 4. **generate-waveform** (Audio)

**Déclenché**: Automatiquement après upload d'un AUDIO
**Priorité**: 15 (basse)
**Données**: `{ mediaId }`

**Statut**: ⏳ **Non implémenté** (placeholder)

**Actions prévues**:
- Analyser le fichier audio avec audiowaveform CLI
- Générer une visualisation SVG
- Créer un `MediaDerivative` de type `WAVEFORM`

**Prérequis**:
```bash
# Installer audiowaveform
sudo apt install audiowaveform  # Linux
brew install audiowaveform      # macOS
```

---

### 5. **generate-video-preview** (Video)

**Déclenché**: Automatiquement après upload d'une VIDEO
**Priorité**: 10 (normale)
**Données**: `{ mediaId }`

**Statut**: ⏳ **Non implémenté** (placeholder)

**Actions prévues**:
- Extraire un clip de 10 secondes avec ffmpeg
- Créer un `MediaDerivative` de type `PREVIEW`

**Prérequis**:
```bash
# Installer ffmpeg
sudo apt install ffmpeg  # Linux
brew install ffmpeg      # macOS
```

---

### 6. **generate-video-thumbnail** (Video)

**Déclenché**: Automatiquement après upload d'une VIDEO
**Priorité**: 10 (normale)
**Données**: `{ mediaId }`

**Statut**: ⏳ **Non implémenté** (placeholder)

**Actions prévues**:
- Extraire une frame à t=2s avec ffmpeg
- Créer un `MediaDerivative` de type `THUMBNAIL`

---

## ⚙️ Configuration Redis

### Installation Redis

**Linux/macOS**:
```bash
# Linux
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis
```

**Windows**:
```bash
# Utiliser WSL ou Docker
docker run -d -p 6379:6379 redis:alpine
```

### Variables d'environnement

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optionnel
```

---

## 🚀 Démarrage

### 1. Démarrer Redis

```bash
# Vérifier que Redis tourne
redis-cli ping
# Réponse attendue: PONG
```

### 2. Démarrer le serveur

```bash
cd japap-backend
npm run dev
```

**Logs attendus**:
```
🚀 Japap Backend listening on http://localhost:4000
📋 Enqueued job 1 (generate-thumbnails) for media abc-123
🖼️  [1] Generating thumbnails for media abc-123
✅ Generated THUMBNAIL: /uploads/...
✅ Job 1 (generate-thumbnails) completed
```

---

## 📊 Monitoring des Jobs

### Accéder aux stats de la queue

```javascript
const { getQueueStats } = require('./jobs/mediaProcessor');

const stats = await getQueueStats();
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   delayed: 0,
//   total: 110
// }
```

### Vérifier le statut d'un job

```javascript
const { getJobStatus } = require('./jobs/mediaProcessor');

const status = await getJobStatus('123');
console.log(status);
// {
//   id: '123',
//   name: 'generate-thumbnails',
//   state: 'completed',
//   progress: 100,
//   attemptsMade: 1,
//   finishedOn: 1704067200000
// }
```

### Bull Board (UI de monitoring)

**Installation** (optionnel):
```bash
npm install @bull-board/express @bull-board/api
```

**Configuration**:
```javascript
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullAdapter(mediaQueue)],
  serverAdapter: serverAdapter,
});

serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());
```

**Accès**: http://localhost:4000/admin/queues

---

## 🔧 Gestion des Erreurs

### Retry automatique

Les jobs échouent automatiquement **3 fois** avec backoff exponentiel:
- Tentative 1: immédiat
- Tentative 2: après 2s
- Tentative 3: après 4s
- Échec final: job marqué `FAILED`

### Logs d'erreurs

```javascript
// Événement 'failed'
mediaQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} (${job.name}) failed:`, err.message);
});
```

### Jobs échoués

Les **200 derniers jobs échoués** sont conservés pour analyse.

**Réessayer un job échoué**:
```javascript
const job = await mediaQueue.getJob('123');
await job.retry();
```

---

## 🧪 Tests

### Test manuel d'un job

```javascript
const { enqueueMediaJob } = require('./jobs/mediaProcessor');

// Enqueue un job de test
const job = await enqueueMediaJob('generate-thumbnails', {
  mediaId: 'test-media-id-123'
});

console.log('Job enqueued:', job.id);

// Attendre résultat
const result = await job.finished();
console.log('Job result:', result);
```

### Test avec Postman/cURL

1. Upload une image via workflow complet:
   ```bash
   # 1. Initiate
   curl -X POST http://localhost:4000/api/alerts/{alertId}/media/initiate \
     -H "Content-Type: application/json" \
     -d '{"type":"IMAGE","position":1,"filename":"test.jpg","mimeType":"image/jpeg","size":1000000}'

   # 2. Upload
   curl -X PUT http://localhost:4000/api/uploads/presigned/{mediaId} \
     -H "Authorization: Bearer {token}" \
     -F "file=@test.jpg"

   # 3. Complete (déclenche jobs)
   curl -X POST http://localhost:4000/api/alerts/{alertId}/media/{mediaId}/complete
   ```

2. Vérifier logs serveur pour confirmation job execution

3. Vérifier fichiers générés:
   ```bash
   ls -la public/uploads/alerts/{alertId}/media/{mediaId}/
   # Doit contenir: original.jpg, {mediaId}-thumbnail.jpg, etc.
   ```

---

## 🎛️ Priorités des Jobs

| Job | Priorité | Raison |
|-----|----------|--------|
| `generate-thumbnails` | 5 (haute) | Nécessaire pour affichage UI immédiat |
| `transcribe-audio` | 5 (haute) | Info critique pour modération |
| `ai-enhancement` | 10 (normale) | Amélioration qualité, non bloquant |
| `generate-video-preview` | 10 (normale) | Améliore UX |
| `generate-video-thumbnail` | 10 (normale) | Améliore UX |
| `generate-waveform` | 15 (basse) | Visuel secondaire |

**Plus la valeur est basse, plus la priorité est haute.**

---

## 📈 Performance

### Recommandations

1. **Redis en production**: Utiliser Redis avec persistance activée
2. **Workers multiples**: Déployer plusieurs instances de `mediaProcessor.js`
3. **Scaling horizontal**: Chaque instance traite les jobs de la même queue
4. **Limites**: Configurer `limiter` pour éviter surcharge API externes

**Exemple limiter**:
```javascript
const QUEUE_OPTIONS = {
  redis: REDIS_CONFIG,
  limiter: {
    max: 10,      // Max 10 jobs
    duration: 60000 // Par minute
  }
};
```

---

## 🚨 Troubleshooting

### Redis connection refused

**Problème**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**:
```bash
# Démarrer Redis
redis-server
# Ou avec systemd
sudo systemctl start redis
```

### OpenAI API key missing

**Problème**: `OPENAI_API_KEY not configured`

**Solution**:
```bash
# Ajouter dans .env
OPENAI_API_KEY=sk-...
```

### Sharp installation error

**Problème**: `Error: Cannot find module 'sharp'`

**Solution**:
```bash
npm install sharp --save
# Ou rebuild
npm rebuild sharp
```

---

## 📚 Ressources

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Bull Board UI](https://github.com/felixmosh/bull-board)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Vertex AI Gemini](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)

---

**Version**: 1.0
**Date**: 2025-01-20
**Auteur**: Claude Code
