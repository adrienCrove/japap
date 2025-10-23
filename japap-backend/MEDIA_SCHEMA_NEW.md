# Nouveau Schéma Prisma - Système Media Unifié

## Instructions d'intégration

Ce fichier contient le nouveau schéma pour le système de média unifié.
**À ajouter dans `prisma/schema.prisma` après le model `Image` actuel.**

## Models à ajouter

```prisma
// ============ UNIFIED MEDIA SYSTEM ============

// Model parent unifié pour tous les types de média
model Media {
  id          String   @id @default(uuid())

  // Type et position dans l'alerte
  type        MediaType // IMAGE | AUDIO | VIDEO
  position    Int?      // 1-3 pour images, null pour audio/vidéo

  // Relations
  alertId     String?
  alert       Alert?    @relation("AlertMedia", fields: [alertId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?     @relation("MediaOwner", fields: [userId], references: [id], onDelete: SetNull)
  uploadedBy  String?
  uploader    User?     @relation("MediaUploader", fields: [uploadedBy], references: [id], onDelete: SetNull)

  // Stockage fichier principal
  filename     String   // {mediaId}-original.{ext}
  originalName String   // Nom du fichier uploadé par l'utilisateur
  path         String   // /uploads/alerts/{alertId}/media/{mediaId}/original.jpg
  url          String   // URL complète accessible
  size         Int      // Bytes
  mimeType     String   // image/jpeg, audio/mpeg, video/mp4

  // Intégrité et sécurité
  checksum     String   // SHA-256 pour détecter corruption/doublons
  capturedAt   DateTime? // Timestamp de capture côté client (EXIF ou metadata)
  receivedAt   DateTime  @default(now()) // Timestamp de réception serveur

  // Métadonnées spécifiques (EXIF, codec, bitrate)
  metadata     Json?    // Flexible pour chaque type

  // Dimensions (images/vidéos)
  width        Int?
  height       Int?

  // Durée (audio/vidéos) en secondes
  duration     Float?   // Ex: 25.5s

  // Workflow upload
  uploadStatus UploadStatus @default(PENDING)
  uploadToken  String?  // JWT token pour upload sécurisé
  uploadExpiry DateTime? // Expiration token (5 min)
  uploadError  String?  // Message d'erreur si FAILED

  // AI Enhancement (images DISP/DECD uniquement)
  isEnhanced          Boolean @default(false)
  originalMediaId     String?
  originalMedia       Media?  @relation("MediaEnhancement", fields: [originalMediaId], references: [id], onDelete: SetNull)
  enhancedVersions    Media[] @relation("MediaEnhancement")
  enhancementMetadata Json?   // { model, processingTime, cost }

  // Relations vers dérivés et transcriptions
  derivatives    MediaDerivative[]
  transcriptions Transcription[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([alertId, type, position]) // Empêche doublons position
  @@index([alertId, type])
  @@index([userId])
  @@index([checksum]) // Détection doublons
  @@index([uploadStatus])
  @@index([uploadExpiry]) // Cleanup tokens expirés
}

// Dérivés générés (thumbnails, previews, waveforms)
model MediaDerivative {
  id          String   @id @default(uuid())

  // Relation vers média parent
  mediaId     String
  media       Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  // Type de dérivé
  derivativeType DerivativeType // THUMBNAIL | MEDIUM | LARGE | PREVIEW | WAVEFORM

  // Stockage
  filename    String   // {mediaId}-thumb.jpg
  path        String   // /uploads/alerts/{alertId}/media/{mediaId}/thumb.jpg
  url         String
  size        Int
  mimeType    String

  // Dimensions (si applicable)
  width       Int?
  height      Int?
  duration    Float?   // Pour previews vidéo

  // Métadonnées de génération
  generatedBy String?  // "sharp", "ffmpeg", "cloudinary"
  metadata    Json?    // Params de génération: quality, compression, etc.

  createdAt   DateTime @default(now())

  @@unique([mediaId, derivativeType]) // Un seul thumbnail par média
  @@index([mediaId])
}

// Transcriptions audio (versionnées)
model Transcription {
  id          String   @id @default(uuid())

  // Relation vers audio
  mediaId     String
  media       Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  // Contenu transcription
  text        String   @db.Text
  language    String?  // "fr", "en"
  confidence  Float?   // 0.0-1.0

  // Version et source
  version     Int      // Auto-incrémenté (1, 2, 3...)
  source      TranscriptionSource // AUTO | HUMAN_CORRECTED | MANUAL
  model       String?  // "openai-whisper-1" ou null

  // Métadonnées
  metadata    Json?    // Word timestamps, alternatives, etc.

  // Qui a créé/corrigé
  createdBy   String?
  creator     User?    @relation(fields: [createdBy], references: [id], onDelete: SetNull)

  // Statut
  isActive    Boolean  @default(false) // Une seule version active

  createdAt   DateTime @default(now())

  @@index([mediaId, version])
  @@index([mediaId, isActive]) // Récupérer la meilleure transcription
}

// ============ ENUMS ============

enum MediaType {
  IMAGE
  AUDIO
  VIDEO
}

enum UploadStatus {
  PENDING      // Slot réservé, upload pas encore commencé
  UPLOADING    // Upload en cours
  PROCESSING   // Upload terminé, génération dérivés en cours
  COMPLETED    // Tout terminé
  FAILED       // Échec
}

enum DerivativeType {
  THUMBNAIL    // 150x150px
  MEDIUM       // 800x600px
  LARGE        // 1920x1080px
  PREVIEW      // Vidéo: 10s clip
  WAVEFORM     // Audio: SVG visualization
}

enum TranscriptionSource {
  AUTO              // Généré par Whisper
  HUMAN_CORRECTED   // Corrigé par humain
  MANUAL            // Saisi manuellement
}
```

## Modifications aux models existants

### Model Alert

```prisma
model Alert {
  // ... tous les champs existants SAUF:
  // - mediaUrl (à supprimer)
  // - images (à remplacer)

  // AJOUTER:
  media Media[] @relation("AlertMedia")

  // Stats calculées (optionnel, pour performance)
  imageCount Int @default(0)
  hasAudio   Boolean @default(false)
  hasVideo   Boolean @default(false)
}
```

### Model User

```prisma
model User {
  // ... tous les champs existants SAUF:
  // - images (à remplacer)
  // - uploadedImages (à remplacer)

  // AJOUTER:
  ownedMedia    Media[]         @relation("MediaOwner")
  uploadedMedia Media[]         @relation("MediaUploader")
  transcriptions Transcription[]
}
```

## Migration

1. Créer la migration: `npx prisma migrate dev --name add_unified_media_system`
2. Exécuter le script de migration des données (voir MIGRATION_SCRIPT.sql)
3. Vérifier les données migrées
4. Supprimer l'ancien model `Image` dans une migration ultérieure

## Ordre d'exécution

1. ✅ Ajouter les nouveaux models (Media, MediaDerivative, Transcription, Enums)
2. ✅ Modifier Alert et User
3. ✅ Créer la migration
4. ✅ Exécuter le script de migration des données
5. ✅ Tester l'intégrité des données
6. ✅ Supprimer le model Image (migration séparée)
