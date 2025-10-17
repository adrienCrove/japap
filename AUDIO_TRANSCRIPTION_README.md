# Fonctionnalité de Transcription Audio avec OpenAI Whisper

Cette fonctionnalité permet aux utilisateurs d'enregistrer leur voix au lieu de taper du texte dans le champ de description des alertes. L'audio est automatiquement transcrit en texte grâce au modèle Whisper d'OpenAI.

## 📋 Vue d'ensemble

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Mobile App     │──────▶│  Backend API     │──────▶│  OpenAI Whisper │
│  (React Native) │      │  (Express.js)    │      │  API            │
└─────────────────┘      └──────────────────┘      └─────────────────┘
       ▲                          │
       │                          │
       └──────────────────────────┘
          Texte transcrit
```

### Flux de fonctionnement

1. **Enregistrement** : L'utilisateur appuie sur le bouton micro dans le champ "Détails"
2. **Capture audio** : L'app enregistre l'audio via expo-av (max 60 secondes)
3. **Upload** : Le fichier audio est envoyé au backend via `/api/transcribe`
4. **Transcription** : Le backend envoie l'audio à l'API Whisper d'OpenAI
5. **Affichage** : Le texte transcrit est automatiquement inséré dans le champ de description

## 🚀 Installation et Configuration

### Backend (japap-backend)

#### 1. Dépendances installées
```json
{
  "openai": "^6.4.0",
  "multer": "^2.0.2" (déjà installé)
}
```

#### 2. Configuration de la clé API OpenAI

Modifiez le fichier `japap-backend/.env` :

```env
# OpenAI API (pour transcription audio avec Whisper)
# Obtenez votre clé API sur https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
```

**Important** : Remplacez `your_openai_api_key_here` par votre vraie clé API OpenAI.

#### 3. Obtenir une clé API OpenAI

1. Allez sur [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Connectez-vous ou créez un compte
3. Cliquez sur "Create new secret key"
4. Copiez la clé générée et ajoutez-la dans votre fichier `.env`

**Note** : L'API Whisper coûte $0.006 par minute d'audio transcrit.

### Frontend Mobile (japap)

#### 1. Dépendances installées
```json
{
  "expo-audio": "^14.0.10"
}
```

**Note importante** : Nous utilisons `expo-audio` au lieu de `expo-av` car ce dernier a été déprécié et sera retiré dans SDK 54. `expo-audio` est la nouvelle API recommandée par Expo.

## 📁 Fichiers créés/modifiés

### Backend

#### Nouveaux fichiers :
- `japap-backend/src/services/audioTranscription.js` - Service de transcription avec OpenAI
- `japap-backend/src/routes/transcription.js` - Route API `/api/transcribe`

#### Fichiers modifiés :
- `japap-backend/src/index.js` - Ajout de la route de transcription
- `japap-backend/.env` - Ajout de `OPENAI_API_KEY`
- `japap-backend/package.json` - Ajout de la dépendance `openai`

### Frontend

#### Nouveaux fichiers :
- `japap/services/audioTranscription.ts` - Service d'enregistrement et transcription audio

#### Fichiers modifiés :
- `japap/components/AlertDetailFormModal.tsx` - Ajout de l'interface d'enregistrement audio
- `japap/package.json` - Ajout de la dépendance `expo-audio`

## 🎯 Utilisation

### Dans l'application mobile

1. Ouvrez le formulaire de création d'alerte
2. Dans la section "Détails", cliquez sur le bouton micro (🎤)
3. Parlez pour enregistrer votre message
4. Cliquez sur le bouton stop (⏹) pour arrêter l'enregistrement
5. Attendez quelques secondes pendant la transcription
6. Le texte transcrit apparaît automatiquement dans le champ de description

### Boutons de contrôle

- **🎤 Micro** : Démarre l'enregistrement
- **⏹ Stop** : Arrête l'enregistrement et lance la transcription
- **✕ Annuler** : Annule l'enregistrement en cours
- **Indicateur de temps** : Affiche la durée d'enregistrement en temps réel

## 🔧 API Backend

### Endpoint de transcription

**POST** `/api/transcribe`

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: Fichier audio (mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg)
  - `language`: Code langue (optionnel, défaut: `fr`)

#### Response Success
```json
{
  "success": true,
  "text": "Texte transcrit de l'audio",
  "duration": 2345,
  "language": "fr"
}
```

#### Response Error
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

### Test de l'endpoint

**GET** `/api/transcribe/test`

Vérifie que l'endpoint est fonctionnel et que la clé API est configurée.

```json
{
  "success": true,
  "message": "Transcription endpoint is working",
  "config": {
    "OPENAI_API_KEY": "configured"
  },
  "supportedFormats": ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg"],
  "maxFileSize": "25MB"
}
```

## 🔒 Permissions requises

### Android
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### iOS
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Cette application a besoin d'accéder au microphone pour enregistrer des messages audio.</string>
```

Les permissions sont automatiquement gérées par expo-av.

## ⚙️ Configuration technique

### Formats audio supportés
- mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg

### Limitations
- **Taille maximale** : 25 MB (limite de l'API Whisper)
- **Durée maximale recommandée** : 60 secondes
- **Langue par défaut** : Français (fr)

### Qualité d'enregistrement
L'enregistrement utilise `RecordingPresets.HIGH_QUALITY` d'expo-audio :
- **Sample Rate** : 44100 Hz
- **Encoding** : AAC (iOS) / AAC (Android)
- **Bit Rate** : Haute qualité optimisée par la plateforme

## 🐛 Débogage

### Problèmes courants

#### 1. Erreur : "OPENAI_API_KEY n'est pas configurée"
**Solution** : Vérifiez que la clé API est bien ajoutée dans `japap-backend/.env`

#### 2. Erreur : "Permission microphone refusée"
**Solution** :
- Vérifiez les permissions de l'app dans les paramètres du téléphone
- Réinstallez l'application

#### 3. Erreur : "Fichier trop volumineux"
**Solution** : Limitez la durée d'enregistrement (max 60 secondes recommandé)

#### 4. Transcription incorrecte
**Solution** :
- Parlez clairement et lentement
- Réduisez le bruit ambiant
- Vérifiez que la langue est correctement configurée (défaut: français)

### Logs utiles

**Backend** :
```bash
🎙️ Début de la transcription audio: /path/to/audio.m4a
✅ Transcription réussie: Le texte transcrit...
🗑️ Fichier temporaire supprimé
```

**Frontend** :
```bash
🎙️ Démarrage de l'enregistrement...
✅ Enregistrement démarré
🛑 Arrêt de l'enregistrement...
✅ Enregistrement arrêté: file:///path/to/recording.m4a
⏱️ Durée: 5000ms
📤 Upload et transcription de: file:///path/to/recording.m4a
📡 Envoi vers: http://localhost:4000/api/transcribe
📥 Réponse serveur: { success: true, text: "..." }
```

## 💰 Coûts

### API OpenAI Whisper
- **Tarif** : $0.006 par minute d'audio
- **Exemple** :
  - 10 secondes d'audio = $0.001
  - 1 minute d'audio = $0.006
  - 100 alertes de 30 secondes = $0.30

## 🔄 Améliorations futures

### Court terme
- [ ] Ajouter un indicateur d'animation pendant l'enregistrement
- [ ] Limiter automatiquement la durée à 60 secondes
- [ ] Ajouter une prévisualisation audio avant transcription

### Moyen terme
- [ ] Support multi-langues (détection automatique)
- [ ] Compression audio avant upload
- [ ] Cache des transcriptions pour éviter les doublons

### Long terme
- [ ] Transcription en temps réel (streaming)
- [ ] Correction automatique de la ponctuation
- [ ] Intégration avec d'autres modèles de transcription

## 📚 Ressources

- [Documentation OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Documentation expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Documentation Multer](https://github.com/expressjs/multer)
- [Migration de expo-av vers expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/#migration-from-expo-av)

## 👥 Support

Pour toute question ou problème :
1. Vérifiez les logs du backend et du frontend
2. Consultez la section "Débogage" ci-dessus
3. Contactez l'équipe de développement

---

**Date de création** : 16 Octobre 2025
**Version** : 1.0.0
**Auteur** : Équipe JAPAP
