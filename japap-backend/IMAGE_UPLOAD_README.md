# 🖼️ Configuration Upload d'Images

## Architecture

```
Mobile App          Backend (Node.js)          API Distante
    |                      |                  (japap.adxcreation.com)
    |---> POST /api/upload |                           |
    |                      |----> POST /upload ------->|
    |                      |      Header: x-api-key    |
    |                      |      FormData: image      |
    |                      |                           |
    |                      |<---- Response ------------|
    |<---- JSON Response --|     { url, filename }    |
    |                      |                           |
    |                      |   [FALLBACK si échec]    |
    |                      |   Stockage local         |
    |<---- JSON Response --|   /uploads/              |
```

## Configuration Backend (.env)

```env
IMG_API_URL=https://japap.adxcreation.com
IMG_API_KEY=1543644e640c3fc15d6150fb50a1cd0211f4b3ada3d04cc585e5d3e
```

## Endpoints API

### 1. Test de l'endpoint local
```bash
GET http://localhost:4000/api/upload/test
```

**Réponse :**
```json
{
  "success": true,
  "message": "Upload endpoint is working",
  "config": {
    "IMG_API_URL": "configured",
    "IMG_API_KEY": "configured"
  }
}
```

### 2. Test de l'API distante
```bash
GET http://localhost:4000/api/upload/test-remote
```

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "API distante accessible",
  "url": "https://japap.adxcreation.com",
  "status": 200
}
```

**Réponse (échec) :**
```json
{
  "success": false,
  "message": "API distante inaccessible",
  "error": "...",
  "code": "ECONNREFUSED"
}
```

### 3. Upload d'image
```bash
POST http://localhost:4000/api/upload
Content-Type: multipart/form-data

file: [binary image data]
```

**Réponse (API distante) :**
```json
{
  "success": true,
  "url": "https://japap.adxcreation.com/images/abc123def456.jpg",
  "filename": "photo.jpg",
  "size": 45678,
  "mimetype": "image/jpeg",
  "storage": "remote"
}
```

**Réponse (fallback local) :**
```json
{
  "success": true,
  "url": "/uploads/1234567890-photo.jpg",
  "filename": "photo.jpg",
  "size": 45678,
  "mimetype": "image/jpeg",
  "storage": "local"
}
```

## API Distante (japap.adxcreation.com)

### Spécifications

**Authentification :**
```
Header: x-api-key: <votre-cle-api>
```

**Endpoints disponibles :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/upload` | Upload une image (champ `image`) |
| POST | `/upload-multiple` | Upload multiple (champ `images`) |
| GET | `/images/:filename` | Récupérer une image |
| GET | `/list` | Liste des images (authentifié) |
| DELETE | `/images/:filename` | Supprimer une image (authentifié) |

**Limites :**
- Taille max : 5MB par image
- Types acceptés : JPEG, PNG, GIF, WebP

### Upload d'image

**Requête :**
```http
POST https://japap.adxcreation.com/upload
x-api-key: 1543644e640c3fc15d6150fb50a1cd0211f4b3ada3d04cc585e5d3e
Content-Type: multipart/form-data

image: [binary data]
```

**Réponse :**
```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "filename": "abc123def456.jpg",
  "url": "https://japap.adxcreation.com/images/abc123def456.jpg",
  "size": 45678
}
```

## Stratégie de Fallback

Le backend utilise une stratégie intelligente à 3 niveaux :

1. **Vérification de la configuration**
   - Si `IMG_API_URL` ou `IMG_API_KEY` manquent → Stockage local

2. **Tentative vers l'API distante**
   - Upload vers `https://japap.adxcreation.com/upload`
   - Timeout : 30 secondes
   - Si succès → Retourne l'URL distante

3. **Fallback automatique**
   - Si échec (timeout, erreur réseau, etc.) → Stockage local
   - Sauvegarde dans `public/uploads/`
   - Retourne URL locale `/uploads/filename.jpg`

## Tests

### Test automatique

```bash
cd japap-backend
node test-remote-api.js
```

Ce script teste :
1. ✅ Connexion à l'API (`GET /list`)
2. ✅ Upload d'une image de test
3. ✅ Suppression de l'image

### Test manuel avec curl

**Test de connexion :**
```bash
curl -H "x-api-key: 1543644e640c3fc15d6150fb50a1cd0211f4b3ada3d04cc585e5d3e" \
  https://japap.adxcreation.com/list
```

**Upload d'image :**
```bash
curl -X POST \
  -H "x-api-key: 1543644e640c3fc15d6150fb50a1cd0211f4b3ada3d04cc585e5d3e" \
  -F "image=@photo.jpg" \
  https://japap.adxcreation.com/upload
```

## Logs

Le backend affiche des logs détaillés :

```
📤 Upload vers API distante: https://japap.adxcreation.com/upload
✅ Image uploadée vers API distante: https://japap.adxcreation.com/images/abc123.jpg
```

Ou en cas de fallback :

```
📤 Upload vers API distante: https://japap.adxcreation.com/upload
❌ Erreur API distante: timeout of 30000ms exceeded
🔄 Fallback vers stockage local...
✅ Image sauvegardée localement: /uploads/1234567890-photo.jpg (45.67 KB)
```

## Dépannage

### Problème : "API distante inaccessible"

**Solutions :**
1. Vérifier que le serveur distant est démarré
2. Vérifier la clé API dans `.env`
3. Vérifier que le serveur distant accepte les connexions externes
4. Le fallback local s'activera automatiquement

### Problème : "Clé API invalide"

**Solutions :**
1. Vérifier `IMG_API_KEY` dans le `.env` du backend
2. Vérifier `API_KEY` dans le `.env` du serveur distant (japap.adxcreation.com)
3. Les deux doivent correspondre

### Problème : Images locales non accessibles

**Solutions :**
1. Vérifier que le dossier `public/uploads/` existe
2. Vérifier que Express sert les fichiers statiques :
   ```javascript
   app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
   ```

## Sécurité

⚠️ **Important en production :**

1. **Changer la clé API** par une clé forte générée aléatoirement
2. **Utiliser HTTPS** pour toutes les communications
3. **Valider les types de fichiers** côté serveur
4. **Limiter la taille des uploads** (actuellement 5MB)
5. **Implémenter un rate limiting** pour éviter les abus
6. **Scanner les fichiers** pour détecter les malwares
7. **Utiliser un CDN** pour servir les images en production

## Mobile App

L'application mobile utilise :
- **Service** : `services/imageUpload.ts`
- **Fonctions** :
  - `pickImageFromGallery()` - Sélectionner depuis galerie
  - `pickImageFromCamera()` - Prendre une photo
  - `uploadImage(uri)` - Upload vers backend

**Exemple :**
```typescript
const image = await pickImageFromGallery();
if (image) {
  const result = await uploadImage(image.uri);
  if (result.success) {
    console.log('URL:', result.url);
  }
}
```
