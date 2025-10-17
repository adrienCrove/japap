# ⚡ Configuration Rapide - Transcription Audio

## 🎯 Étape obligatoire pour activer la transcription

La fonctionnalité de transcription audio est maintenant implémentée, mais vous devez configurer votre clé API OpenAI pour qu'elle fonctionne.

## 📝 Étapes de configuration

### 1. Obtenir une clé API OpenAI

1. Allez sur [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Connectez-vous ou créez un compte OpenAI
3. Cliquez sur **"Create new secret key"**
4. Donnez un nom à votre clé (ex: "JAPAP Audio Transcription")
5. **Copiez immédiatement la clé** (vous ne pourrez plus la voir après)

### 2. Configurer le backend

Ouvrez le fichier `japap-backend/.env` et remplacez :

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Par votre vraie clé API :

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Redémarrer le serveur backend

```bash
cd japap-backend
npm run dev
```

## ✅ Vérification

Pour vérifier que tout fonctionne, ouvrez dans votre navigateur :

```
http://localhost:4000/api/transcribe/test
```

Vous devriez voir :

```json
{
  "success": true,
  "message": "Transcription endpoint is working",
  "config": {
    "OPENAI_API_KEY": "configured"
  }
}
```

## 🎤 Utilisation dans l'app

1. Ouvrez l'app mobile JAPAP
2. Créez une nouvelle alerte
3. Dans le champ "Détails", cliquez sur l'icône micro 🎤
4. Parlez pour enregistrer votre message
5. Cliquez sur le bouton stop ⏹
6. Le texte transcrit apparaît automatiquement !

## 💰 Coûts

L'API Whisper coûte **$0.006 par minute** d'audio :
- 10 secondes = ~$0.001
- 30 secondes = ~$0.003
- 1 minute = $0.006

**Exemple** : Pour 100 alertes de 30 secondes chacune = $0.30

## 🔧 Fichiers modifiés

### Backend
- ✅ `src/services/audioTranscription.js` (nouveau)
- ✅ `src/routes/transcription.js` (nouveau)
- ✅ `src/index.js` (modifié)
- ⚠️ `.env` (À CONFIGURER)
- ✅ Dépendance : `openai` (installée)

### Frontend
- ✅ `services/audioTranscription.ts` (nouveau)
- ✅ `components/AlertDetailFormModal.tsx` (modifié)
- ✅ Dépendance : `expo-audio` (installée - remplace expo-av déprécié)

## 📚 Documentation complète

Pour plus de détails, consultez :
- `AUDIO_TRANSCRIPTION_README.md` - Documentation complète
- [OpenAI Whisper Documentation](https://platform.openai.com/docs/guides/speech-to-text)

## ❓ Besoin d'aide ?

Si vous rencontrez des problèmes :

1. **Erreur "OPENAI_API_KEY manquante"**
   - Vérifiez que vous avez bien ajouté la clé dans `.env`
   - Redémarrez le serveur backend

2. **Transcription ne fonctionne pas**
   - Testez l'endpoint : `http://localhost:4000/api/transcribe/test`
   - Vérifiez les logs du serveur backend
   - Vérifiez que votre clé API est valide et a du crédit

3. **Permission microphone refusée**
   - Allez dans les paramètres du téléphone
   - Autorisez l'accès au microphone pour l'app JAPAP

---

**Date** : 16 Octobre 2025
**Status** : ✅ Implémentation terminée - ⚠️ Configuration requise
