# 🎨 Image Enhancement avec Gemini 2.5 Flash Image (Nano Banana)

## Vue d'ensemble

Ce système améliore automatiquement les photos soumises pour les alertes de **disparition (DISP)** et **décès (DECD)** en utilisant l'API Gemini 2.5 Flash Image de Google. Les portraits sont transformés en images HD haute qualité pour faciliter l'identification des personnes.

## 📋 Prérequis

### 1. Configuration Firebase/Google Cloud

```bash
# 1. Créer un projet Firebase
https://console.firebase.google.com/

# 2. Activer Vertex AI
https://console.cloud.google.com/vertex-ai

# 3. Upgrade vers Blaze plan (carte bancaire requise)
Firebase Console > Upgrade > Blaze (Pay as you go)

# 4. Générer service account credentials
Firebase Console > Project Settings > Service Accounts > Generate new private key
```

### 2. Installation des dépendances

Les packages suivants ont été installés :

```bash
npm install @google-cloud/vertexai firebase-admin
```

**Dépendances :**
- `@google-cloud/vertexai` : Client Vertex AI pour Gemini API
- `firebase-admin` : Firebase Admin SDK pour authentification
- `sharp` : Manipulation d'images (déjà installé)
- `@prisma/client` : ORM base de données (déjà installé)

## ⚙️ Configuration

### 1. Variables d'environnement

Copier `.env.example` vers `.env` et remplir :

```bash
# Google Cloud / Firebase
GOOGLE_CLOUD_PROJECT_ID="votre-projet-id"
FIREBASE_PROJECT_ID="votre-projet-id"
GOOGLE_APPLICATION_CREDENTIALS="./config/firebase-service-account.json"
VERTEX_AI_LOCATION="us-central1"

# Image Enhancement
IMAGE_ENHANCEMENT_ENABLED=true
IMAGE_ENHANCEMENT_CATEGORIES="DISP,DECD"
```

### 2. Service Account Credentials

1. Télécharger le fichier JSON de service account depuis Firebase
2. Le placer dans `japap-backend/config/firebase-service-account.json`
3. **IMPORTANT** : Ajouter ce fichier à `.gitignore` !

```bash
# Dans .gitignore
config/firebase-service-account.json
.env
```

### 3. Migration de la base de données

Le schéma Prisma a été mis à jour avec de nouveaux champs :

```prisma
model Image {
  // ... champs existants ...

  // AI Enhancement fields
  isEnhanced          Boolean @default(false)
  originalImageId     String?
  originalImage       Image?  @relation("ImageEnhancement", ...)
  enhancedVersions    Image[] @relation("ImageEnhancement")
  enhancementMetadata Json?
}
```

**Appliquer la migration** :

```bash
# IMPORTANT: Arrêter le serveur backend d'abord
pm2 stop japap-backend

# Appliquer la migration
npx prisma migrate dev --name add_image_enhancement_fields

# Redémarrer le serveur
pm2 start japap-backend
```

## 🚀 Architecture

### Fichiers créés

```
japap-backend/
├── src/
│   ├── config/
│   │   └── vertexai.js              # Configuration Vertex AI & Firebase
│   ├── services/
│   │   └── imageEnhancementService.js   # Service d'amélioration d'images
│   └── middleware/
│       └── categoryImageEnhancement.js  # Middleware d'auto-amélioration
└── .env.example                      # Template variables d'environnement
```

### Flux de traitement

```
1. Upload image (mobile app)
   ↓
2. Sauvegarde dans /uploads/alerts/{alertId}/
   ↓
3. Création enregistrement Image dans DB
   ↓
4. [SI catégorie = DISP ou DECD]
   ↓
5. Déclenchement amélioration (async background)
   ↓
6. Gemini API améliore l'image (2-5 secondes)
   ↓
7. Sauvegarde image améliorée avec suffix "_enhanced"
   ↓
8. Création nouvel enregistrement Image (isEnhanced=true)
   ↓
9. Mise à jour Alert.mediaUrl avec image améliorée
   ↓
10. Utilisateur voit l'image HD sur la carte/liste
```

## 🛠️ Utilisation

### Amélioration automatique

L'amélioration est **automatique** pour les catégories configurées (DISP, DECD) :

```javascript
// Dans adminUpload.js (déjà implémenté)
const { triggerCategoryImageEnhancement } = require('../middleware/categoryImageEnhancement');

// Après création de l'image
triggerCategoryImageEnhancement(imageRecord, alert.category, alertId);
// Runs in background, non-blocking
```

### Amélioration manuelle

Pour améliorer une image existante :

```javascript
const { enhancePortrait } = require('./services/imageEnhancementService');

// Améliorer une image spécifique
const result = await enhancePortrait(imageId, {
  categoryCode: 'DISP',
  prompt: 'Custom prompt...' // Optionnel
});

if (result.success) {
  console.log(`Image améliorée: ${result.enhancedImageId}`);
  console.log(`Coût: $${result.cost}`);
}
```

### Amélioration en batch

Pour re-traiter des images existantes :

```javascript
const { batchEnhanceImages } = require('./middleware/categoryImageEnhancement');

const images = [
  { imageId: 'img-1', categoryCode: 'DISP', alertId: 'alert-1' },
  { imageId: 'img-2', categoryCode: 'DECD', alertId: 'alert-2' },
];

const results = await batchEnhanceImages(images);
console.log(`${results.filter(r => r.success).length} images améliorées`);
```

## 💰 Coûts & Limites

### Tarification Gemini 2.5 Flash Image

- **Gratuit** : 500 requêtes/jour par projet
- **Payant** : $0.039 par image (1290 tokens @ $30/1M tokens)

### Estimation pour 50 images/jour

```
Coût quotidien  : 50 × $0.039 = $1.95/jour
Coût mensuel    : ~$60/mois
Coût annuel     : ~$720/an

Note: Les 500 premières requêtes/jour sont gratuites
Si < 500 images/jour → 100% GRATUIT
```

### Rate Limits

- **Gratuit** : 500 requests/day
- **Payant** : 1000 requests/minute (max)

## 📊 Monitoring

### Logs

Les améliorations sont loggées automatiquement :

```
🎨 Triggering automatic image enhancement for category DISP, image ID: abc123
📡 Calling Gemini 2.5 Flash Image API...
✅ Image enhancement completed in 3500ms - Enhanced image ID: xyz789
   - Processing time: 3500ms
   - Cost: $0.039
✅ Alert alert-123 updated with enhanced image
```

### Metadata stockée

Chaque amélioration enregistre :

```json
{
  "model": "gemini-2.5-flash-image",
  "prompt": "Enhance this portrait photo to create...",
  "processingTime": 3500,
  "cost": 0.039,
  "timestamp": "2025-01-18T10:30:00.000Z",
  "categoryCode": "DISP"
}
```

### Requêtes SQL utiles

```sql
-- Images améliorées
SELECT * FROM "Image" WHERE "isEnhanced" = true;

-- Nombre d'améliorations par catégorie
SELECT
  "enhancementMetadata"->>'categoryCode' as category,
  COUNT(*) as count,
  SUM(("enhancementMetadata"->>'cost')::numeric) as total_cost
FROM "Image"
WHERE "isEnhanced" = true
GROUP BY category;

-- Temps de traitement moyen
SELECT
  AVG(("enhancementMetadata"->>'processingTime')::int) as avg_ms
FROM "Image"
WHERE "isEnhanced" = true;
```

## 🔧 Dépannage

### Erreur : "GOOGLE_CLOUD_PROJECT_ID is not set"

**Solution** : Vérifier le fichier `.env`
```bash
GOOGLE_CLOUD_PROJECT_ID="votre-projet-id"
```

### Erreur : "Error initializing Firebase Admin"

**Solutions** :
1. Vérifier que le fichier service account JSON existe
2. Vérifier le chemin dans `GOOGLE_APPLICATION_CREDENTIALS`
3. Vérifier les permissions du fichier (lecture autorisée)

### Erreur : "Vertex AI API not enabled"

**Solution** : Activer Vertex AI dans Google Cloud Console
```bash
https://console.cloud.google.com/vertex-ai
→ Enable API
```

### Erreur : "Billing account required"

**Solution** : Upgrader vers Blaze plan dans Firebase
```
Firebase Console → Upgrade → Blaze (Pay as you go)
```

### L'amélioration ne se déclenche pas

**Vérifications** :
1. Catégorie de l'alerte est bien "DISP" ou "DECD"
2. `IMAGE_ENHANCEMENT_ENABLED=true` dans `.env`
3. Vérifier les logs du serveur pour erreurs
4. L'image n'est pas déjà améliorée (`isEnhanced=false`)

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter** :
   - `.env`
   - `firebase-service-account.json`
   - Clés API

2. **Permissions minimales** :
   - Service account avec rôle "Vertex AI User"
   - Pas de rôle "Owner" ou "Editor"

3. **Rotation des clés** :
   - Changer le service account tous les 90 jours
   - Révoquer les anciennes clés

4. **Environnements séparés** :
   - Projet Firebase différent pour dev/prod
   - Service accounts différents

## 📝 Notes importantes

1. **Latence** : L'amélioration prend 2-5 secondes. Processus asynchrone pour ne pas bloquer l'upload.

2. **Stockage** : Images originales ET améliorées sont conservées (2x espace disque).

3. **Fallback** : Si l'amélioration échoue, l'image originale est utilisée.

4. **Qualité** : Le prompt est optimisé pour portraits d'identification. Peut être ajusté dans `config/vertexai.js`.

5. **Langues** : Le prompt actuel est en anglais pour meilleures performances. Gemini supporte le français si besoin.

## 🎯 Prochaines étapes

### Améliorations futures

- [ ] Dashboard admin pour visualiser améliorations
- [ ] Comparaison avant/après dans l'UI
- [ ] Ajustement automatique du prompt selon qualité image source
- [ ] Support de vidéos (extraction frame + amélioration)
- [ ] Détection automatique de visages avant amélioration
- [ ] A/B testing de différents prompts

### Catégories additionnelles

Pour ajouter d'autres catégories :

```javascript
// Dans config/vertexai.js
IMAGE_ENHANCEMENT_CONFIG.enhancementCategories = ['DISP', 'DECD', 'NOUV'];
```

## 📚 Ressources

- [Gemini 2.5 Flash Image Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image)
- [Vertex AI in Firebase](https://firebase.google.com/docs/vertex-ai)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

---

**Créé le** : 2025-01-18
**Version** : 1.0.0
**Auteur** : JAPAP Team
