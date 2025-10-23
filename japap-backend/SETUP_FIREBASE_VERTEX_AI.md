# 🚀 Guide de configuration Firebase & Vertex AI pour JAPAP

## Résumé

Ce guide vous accompagne étape par étape pour configurer l'amélioration automatique d'images avec Gemini 2.5 Flash Image.

**Durée estimée** : 15-20 minutes

---

## ✅ Étape 1 : Créer un projet Firebase

### 1.1 Accéder à Firebase Console

```
https://console.firebase.google.com/
```

### 1.2 Créer un nouveau projet

1. Cliquer sur "Add project" / "Ajouter un projet"
2. Nom du projet : `japap-production` (ou votre choix)
3. Activer Google Analytics : **OUI** (recommandé)
4. Choisir un compte Google Analytics ou en créer un
5. Cliquer sur "Create project"

### 1.3 Noter le Project ID

Une fois le projet créé :
- Aller dans **Project Settings** (⚙️ icône)
- Noter le **Project ID** (ex: `japap-production-abc123`)
- Vous en aurez besoin pour `.env`

---

## ✅ Étape 2 : Upgrader vers Blaze Plan

⚠️ **IMPORTANT** : Gemini 2.5 Flash Image nécessite le plan Blaze (pay-as-you-go)

### 2.1 Upgrade depuis Firebase Console

1. Dans Firebase Console, en bas à gauche
2. Cliquer sur "Upgrade" ou "Spark plan → Blaze"
3. Ajouter une carte bancaire
4. Configurer le budget (optionnel mais recommandé)

### 2.2 Configurer un budget alert

**Fortement recommandé** pour éviter les surprises :

```
Google Cloud Console → Billing → Budgets & alerts
→ Create Budget
→ Montant : $100/mois (ajustable)
→ Alerts à 50%, 90%, 100%
```

**Note** : Les 500 premières requêtes/jour sont gratuites. Si vous faites 50 images/jour, coût estimé : ~$60/mois.

---

## ✅ Étape 3 : Activer Vertex AI

### 3.1 Accéder à Google Cloud Console

```
https://console.cloud.google.com/
```

Sélectionner votre projet Firebase dans le sélecteur en haut.

### 3.2 Activer Vertex AI API

**Option A - Via l'interface** :
```
Navigation Menu (☰) → Artificial Intelligence → Vertex AI
→ Cliquer sur "ENABLE" si l'API n'est pas activée
```

**Option B - Via Cloud Shell** :
```bash
gcloud services enable aiplatform.googleapis.com
```

### 3.3 Vérifier l'activation

Aller sur :
```
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
```

Status devrait être : ✅ "API enabled"

---

## ✅ Étape 4 : Créer un Service Account

### 4.1 Accéder à la section Service Accounts

```
Firebase Console → Project Settings → Service Accounts
```

OU

```
Google Cloud Console → IAM & Admin → Service Accounts
```

### 4.2 Créer un nouveau Service Account

1. Cliquer sur "Create Service Account"
2. **Nom** : `japap-vertex-ai-service`
3. **Description** : `Service account for Gemini image enhancement`
4. Cliquer sur "Create and continue"

### 4.3 Attribuer les rôles

Ajouter les rôles suivants :

- **Vertex AI User** (`roles/aiplatform.user`)
- **Storage Object Viewer** (`roles/storage.objectViewer`) - si stockage Cloud Storage

Cliquer sur "Continue" puis "Done"

### 4.4 Générer la clé privée

1. Dans la liste des service accounts, cliquer sur celui que vous venez de créer
2. Aller dans l'onglet "KEYS"
3. Cliquer sur "ADD KEY" → "Create new key"
4. Type : **JSON**
5. Cliquer sur "CREATE"

Un fichier JSON sera téléchargé. **CONSERVEZ-LE PRÉCIEUSEMENT !**

---

## ✅ Étape 5 : Configurer le projet backend

### 5.1 Placer le fichier Service Account

```bash
# Créer le dossier config s'il n'existe pas
mkdir -p japap-backend/config

# Renommer et déplacer le fichier téléchargé
mv ~/Downloads/japap-production-abc123-xyz789.json japap-backend/config/firebase-service-account.json
```

**IMPORTANT** : Vérifier que ce fichier est dans `.gitignore` !

### 5.2 Créer le fichier `.env`

Copier le template :
```bash
cd japap-backend
cp .env.example .env
```

### 5.3 Remplir les variables Firebase

Éditer `japap-backend/.env` :

```bash
# ========================================
# Firebase & Vertex AI Configuration
# ========================================

# Remplacer par votre Project ID (trouvé à l'étape 1.3)
GOOGLE_CLOUD_PROJECT_ID="japap-production-abc123"
FIREBASE_PROJECT_ID="japap-production-abc123"

# Chemin vers le service account JSON
GOOGLE_APPLICATION_CREDENTIALS="./config/firebase-service-account.json"

# Location Vertex AI (us-central1 recommandé)
VERTEX_AI_LOCATION="us-central1"

# Activer l'amélioration
IMAGE_ENHANCEMENT_ENABLED=true
IMAGE_ENHANCEMENT_CATEGORIES="DISP,DECD"
```

**Locations disponibles** :
- `us-central1` (Iowa, USA) - Recommandé
- `us-east1` (Caroline du Sud, USA)
- `europe-west1` (Belgique)
- `asia-east1` (Taiwan)

---

## ✅ Étape 6 : Appliquer la migration Prisma

### 6.1 Arrêter le serveur backend

```bash
# Si lancé avec PM2
pm2 stop japap-backend

# Si lancé avec npm/node
# Ctrl+C dans le terminal
```

### 6.2 Appliquer la migration

**Option A - Migration classique** (peut échouer avec erreur "WITH") :
```bash
cd japap-backend
npx prisma migrate dev --name add_image_enhancement_fields
```

**Option B - Push direct** (recommandé si Option A échoue) :
```bash
cd japap-backend
npx prisma db push
npx prisma generate
```

**Sortie attendue** :
```
✔ Your database is now in sync with your Prisma schema
✔ Generated Prisma Client
```

### 6.3 Vérifier la migration

```bash
npx prisma studio
```

Ouvrir le modèle `Image`, vérifier la présence des nouveaux champs :
- `isEnhanced`
- `originalImageId`
- `enhancementMetadata`

---

## ✅ Étape 7 : Tester l'intégration

### 7.1 Démarrer le serveur

```bash
# Avec PM2
pm2 start japap-backend

# Ou avec npm
npm run dev
```

### 7.2 Vérifier les logs

Vous devriez voir :
```
✅ Firebase Admin initialized with service account
✅ Vertex AI configured for project: japap-production-abc123
Server running on port 4000
```

### 7.3 Test manuel (optionnel)

Créer un script de test :

```javascript
// test-enhancement.js
const { enhancePortrait } = require('./src/services/imageEnhancementService');

async function test() {
  const result = await enhancePortrait('image-id-here', {
    categoryCode: 'DISP'
  });

  console.log('Result:', result);
}

test();
```

Lancer :
```bash
node test-enhancement.js
```

---

## ✅ Étape 8 : Vérifier le fonctionnement

### 8.1 Créer une alerte de test

Depuis l'app mobile :
1. Créer une alerte de catégorie **DISP** (Disparition)
2. Uploader une photo de portrait
3. Soumettre l'alerte

### 8.2 Vérifier les logs backend

Vous devriez voir :
```
✅ [ADMIN] Image uploadée: /uploads/alerts/abc123/image.jpg
🎨 Triggering automatic image enhancement for category DISP, image ID: xyz789
📡 Calling Gemini 2.5 Flash Image API...
✅ Image enhancement completed in 3200ms - Enhanced image ID: enhanced-123
✅ Alert abc123 updated with enhanced image
```

### 8.3 Vérifier en base de données

```sql
-- Images améliorées
SELECT * FROM "Image" WHERE "isEnhanced" = true;

-- Dernières améliorations
SELECT
  id,
  filename,
  "isEnhanced",
  "enhancementMetadata"->>'processingTime' as time_ms,
  "enhancementMetadata"->>'cost' as cost_usd
FROM "Image"
WHERE "isEnhanced" = true
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

## 🔧 Dépannage

### Problème : Firebase Admin initialization failed

**Vérifier** :
```bash
# Le fichier existe-t-il ?
ls -la japap-backend/config/firebase-service-account.json

# Le Project ID est-il correct dans .env ?
cat japap-backend/.env | grep GOOGLE_CLOUD_PROJECT_ID
```

### Problème : Vertex AI API not enabled

**Solution** :
```bash
# Via gcloud CLI
gcloud services enable aiplatform.googleapis.com --project=votre-project-id

# OU via console
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
```

### Problème : Permission denied

**Vérifier les rôles du service account** :
```
Google Cloud Console → IAM & Admin → IAM
→ Trouver votre service account
→ Vérifier : "Vertex AI User" role
```

### Problème : Billing account required

**Vérifier le plan Firebase** :
```
Firebase Console → en bas à gauche
→ Devrait afficher "Blaze plan"
```

---

## 📊 Monitoring des coûts

### Voir l'utilisation actuelle

```
Google Cloud Console → Billing → Reports
→ Filtrer par service : "Vertex AI"
```

### Dashboard Firebase

```
Firebase Console → Usage
→ Vertex AI requests
```

### Requête SQL pour coût total

```sql
SELECT
  COUNT(*) as total_enhancements,
  SUM(("enhancementMetadata"->>'cost')::numeric) as total_cost_usd,
  AVG(("enhancementMetadata"->>'processingTime')::int) as avg_time_ms
FROM "Image"
WHERE "isEnhanced" = true;
```

---

## 📝 Checklist finale

- [ ] Projet Firebase créé
- [ ] Plan Blaze activé (carte bancaire ajoutée)
- [ ] Budget alert configuré
- [ ] Vertex AI API activée
- [ ] Service Account créé avec bon rôle
- [ ] Clé JSON téléchargée et placée dans `/config`
- [ ] `.env` configuré avec Project ID
- [ ] Migration Prisma appliquée
- [ ] Serveur backend redémarré
- [ ] Logs montrent "Firebase Admin initialized"
- [ ] Test avec une alerte DISP réussi
- [ ] Image améliorée visible en DB

---

## 🎉 C'est terminé !

Votre système d'amélioration d'images est maintenant opérationnel !

**Prochaines étapes** :
1. Tester avec plusieurs images
2. Surveiller les coûts pendant 1 semaine
3. Ajuster le prompt si nécessaire
4. Ajouter dashboard admin pour visualisation

**Support** :
- Documentation complète : `IMAGE_ENHANCEMENT_README.md`
- Logs backend : `pm2 logs japap-backend`
- Firebase Console : https://console.firebase.google.com/

---

**Créé le** : 2025-01-18
**Version** : 1.0.0
