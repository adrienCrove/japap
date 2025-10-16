# 📸 Guide de Gestion des Images - JAPAP

## Vue d'ensemble

Système complet de gestion d'images avec :
- **Organisation par répertoires** : Dossiers séparés pour chaque alerte/utilisateur
- **Upload depuis l'admin** : Interface drag & drop dans le dashboard
- **Base de données** : Modèle Prisma avec relations
- **Stockage local/distant** : Support local avec fallback automatique

## 📁 Architecture des Répertoires

```
japap-backend/public/uploads/
├── alerts/
│   ├── alert-{id}/
│   │   ├── {timestamp}-{hash}-image1.jpg
│   │   ├── {timestamp}-{hash}-image2.png
│   │   └── metadata.json
│   └── alert-{id2}/
├── users/
│   └── user-{id}/
│       └── avatar.jpg
├── admin/
│   └── banner.jpg
├── broadcast/
│   └── campaign-image.jpg
└── temp/
    └── pending-upload.jpg
```

## 🗄️ Modèle de Base de Données

### Table `Image`

```prisma
model Image {
  id           String   @id @default(uuid())
  filename     String   // Nom stocké: 1234567890-abc123-image.jpg
  originalName String   // Nom original: photo.jpg
  path         String   // Chemin: /uploads/alerts/alert-123/...
  url          String   // URL complète
  size         Int      // Taille en bytes
  mimeType     String   // image/jpeg, image/png, etc.
  width        Int?
  height       Int?

  // Relations
  alertId    String?
  alert      Alert?
  userId     String?
  user       User?
  uploadedBy String?
  uploader   User?

  // Classification
  category String?  // "alert", "user", "admin", "broadcast", "temp"
  isPublic Boolean @default(false)
  storage  String @default("local")
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔧 Backend - API

### Routes principales

#### 1. Upload standard (public)
```http
POST /api/upload?category=alert&entityId=123&userId=456
Content-Type: multipart/form-data

file: [binary]
```

**Réponse:**
```json
{
  "success": true,
  "id": "uuid",
  "url": "/uploads/alerts/alert-123/1234567890-abc123-image.jpg",
  "filename": "1234567890-abc123-image.jpg",
  "originalName": "photo.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg",
  "dimensions": { "width": 1920, "height": 1080 },
  "storage": "local",
  "category": "alert"
}
```

#### 2. Upload admin (authentifié)
```http
POST /api/admin/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary]
category: admin
isPublic: true
```

#### 3. Upload multiple
```http
POST /api/admin/upload/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

files[]: [binary1]
files[]: [binary2]
category: alert
entityId: 123
```

#### 4. Récupérer les images
```http
GET /api/admin/upload/images?page=1&limit=20&category=alert
GET /api/admin/upload/images/alert/:alertId
GET /api/admin/upload/images/:imageId
GET /api/admin/upload/images/stats
```

#### 5. Modifier/Supprimer
```http
PATCH /api/admin/upload/images/:imageId
DELETE /api/admin/upload/images/:imageId
DELETE /api/admin/upload/images/alert/:alertId
```

### Fichiers backend créés

```
japap-backend/
├── src/
│   ├── controllers/
│   │   └── imageController.js          # Logique métier CRUD
│   ├── routes/
│   │   ├── uploadImg.js                # Route upload standard
│   │   └── adminUpload.js              # Routes admin
│   ├── utils/
│   │   └── fileUtils.js                # Helpers gestion fichiers
│   └── index.js                        # Routes enregistrées
└── prisma/
    └── schema.prisma                   # Modèle Image ajouté
```

## 💻 Frontend - Admin Dashboard

### Composants React

#### 1. `ImageUploader.tsx`
Composant d'upload avec drag & drop

```tsx
import ImageUploader from '@/components/upload/ImageUploader';

<ImageUploader
  category="alert"
  entityId="123"
  multiple={true}
  maxFiles={5}
  maxSize={10}
  onUploadSuccess={(images) => {
    console.log('Images uploadées:', images);
  }}
  onUploadError={(error) => {
    console.error('Erreur:', error);
  }}
/>
```

**Props:**
- `category`: "alert" | "user" | "admin" | "broadcast" | "temp"
- `entityId`: ID de l'entité (optionnel)
- `userId`: ID du propriétaire (optionnel)
- `multiple`: Autoriser plusieurs fichiers
- `maxFiles`: Nombre maximum de fichiers (défaut: 5)
- `maxSize`: Taille max en MB (défaut: 10)

#### 2. `ImageGallery.tsx`
Galerie d'affichage avec actions

```tsx
import ImageGallery from '@/components/upload/ImageGallery';
import { getAlertImages } from '@/lib/imageApi';

const images = await getAlertImages('alert-123');

<ImageGallery
  images={images}
  columns={4}
  showActions={true}
  onDelete={(imageId) => {
    console.log('Image supprimée:', imageId);
  }}
/>
```

**Props:**
- `images`: Array d'objets Image
- `columns`: 2 | 3 | 4 | 5 (défaut: 4)
- `showActions`: Afficher boutons actions (défaut: true)
- `onDelete`: Callback après suppression

#### 3. `imageApi.ts`
Service API pour les appels backend

```tsx
import {
  uploadImage,
  uploadMultipleImages,
  getAllImages,
  getAlertImages,
  getImageById,
  updateImage,
  deleteImage,
  deleteAlertImages,
  getImageStats,
  getImageUrl,
} from '@/lib/imageApi';

// Upload une image
const image = await uploadImage(file, {
  category: 'alert',
  entityId: '123',
  isPublic: true,
}, token);

// Récupérer les images d'une alerte
const images = await getAlertImages('alert-123', token);

// Supprimer une image
await deleteImage('image-id', token);

// Construire l'URL complète
const fullUrl = getImageUrl('/uploads/alerts/alert-123/image.jpg');
```

### Fichiers frontend créés

```
japap-admin/
├── components/
│   └── upload/
│       ├── ImageUploader.tsx           # Composant upload
│       └── ImageGallery.tsx            # Composant galerie
└── lib/
    └── imageApi.ts                     # Client API
```

## 🚀 Utilisation dans l'Admin

### Exemple 1: Upload dans un formulaire d'alerte

```tsx
"use client";

import { useState } from 'react';
import ImageUploader from '@/components/upload/ImageUploader';
import ImageGallery from '@/components/upload/ImageGallery';
import { getAlertImages } from '@/lib/imageApi';

export default function AlertForm({ alertId }: { alertId: string }) {
  const [images, setImages] = useState([]);

  // Charger les images existantes
  useEffect(() => {
    async function loadImages() {
      const data = await getAlertImages(alertId);
      setImages(data);
    }
    loadImages();
  }, [alertId]);

  return (
    <div>
      <h2>Ajouter des images</h2>
      <ImageUploader
        category="alert"
        entityId={alertId}
        multiple={true}
        onUploadSuccess={(newImages) => {
          setImages([...images, ...newImages]);
        }}
      />

      <h2>Images de l'alerte</h2>
      <ImageGallery
        images={images}
        onDelete={(imageId) => {
          setImages(images.filter(img => img.id !== imageId));
        }}
      />
    </div>
  );
}
```

### Exemple 2: Page de gestion des médias

```tsx
// app/dashboard/media/page.tsx
import { getAllImages } from '@/lib/imageApi';
import ImageGallery from '@/components/upload/ImageGallery';

export default async function MediaPage() {
  const { images } = await getAllImages(1, 50);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bibliothèque de médias</h1>
      <ImageGallery images={images} columns={5} />
    </div>
  );
}
```

## 🔐 Sécurité & Validation

### Backend

- **Validation des types**: Uniquement JPG, PNG, GIF, WebP, SVG
- **Taille limitée**: 10MB par défaut
- **Noms sécurisés**: Génération automatique avec timestamp + hash
- **Authentification**: Middleware sur les routes admin
- **Autorisation**: Vérification du rôle admin

### Frontend

- **Validation côté client**: Même que le backend
- **Prévisualisation sécurisée**: Via FileReader API
- **Gestion d'erreurs**: Affichage des erreurs utilisateur

## 📊 Fonctionnalités Avancées

### Métadonnées

Chaque dossier peut contenir un `metadata.json`:

```json
{
  "alertId": "123",
  "uploadedBy": "admin-456",
  "totalImages": 3,
  "totalSize": 5242880,
  "lastUpdated": "2025-10-15T10:30:00Z"
}
```

### Nettoyage automatique

Utiliser le service de nettoyage pour supprimer les fichiers temporaires:

```js
const fileUtils = require('./src/utils/fileUtils');

// Nettoyer les fichiers temp de plus de 24h
await fileUtils.cleanupTempFiles(24);
```

### Cron job suggéré

```js
// Dans src/index.js
const cron = require('node-cron');
const fileUtils = require('./utils/fileUtils');

// Tous les jours à 3h du matin
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Nettoyage des fichiers temporaires...');
  const deleted = await fileUtils.cleanupTempFiles(24);
  console.log(`✅ ${deleted} fichier(s) supprimé(s)`);
});
```

## 🛠️ Installation & Migration

### 1. Installer les dépendances (optionnel)

```bash
cd japap-backend
npm install sharp  # Pour les dimensions d'images
```

### 2. Créer la migration Prisma

```bash
cd japap-backend
npx prisma migrate dev --name add_image_model
```

### 3. Générer le client Prisma

```bash
npx prisma generate
```

### 4. Redémarrer les serveurs

```bash
# Backend
npm run dev

# Admin
cd ../japap-admin
npm run dev
```

## 📝 TODO / Améliorations futures

- [ ] Génération automatique de vignettes (thumbnails)
- [ ] Compression d'images automatique
- [ ] Watermarking pour les images publiques
- [ ] Support vidéos et documents
- [ ] CDN externe (Cloudinary, AWS S3)
- [ ] Édition d'images (crop, rotate, filters)
- [ ] Recherche d'images par métadonnées
- [ ] Export en masse (ZIP)

## 🐛 Dépannage

### L'upload échoue avec "Type de fichier non autorisé"

Vérifier que le type MIME est bien dans la liste autorisée dans [fileUtils.js](japap-backend/src/utils/fileUtils.js:286).

### Les images ne s'affichent pas

1. Vérifier que le serveur sert bien les fichiers statiques:
   ```js
   app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
   ```

2. Vérifier les URLs générées:
   ```js
   console.log(getImageUrl('/uploads/...'));
   ```

### Erreur Prisma "Unknown field"

Regénérer le client Prisma:
```bash
npx prisma generate
```

### Les images ne se suppriment pas

Vérifier les permissions du dossier `public/uploads`:
```bash
chmod -R 755 public/uploads
```

## 📚 Ressources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Multer](https://github.com/expressjs/multer)
- [Sharp (traitement d'images)](https://sharp.pixelplumbing.com/)
- [React Dropzone](https://react-dropzone.js.org/)

---

**Auteur**: Claude Code
**Date**: 15 octobre 2025
**Version**: 1.0.0
