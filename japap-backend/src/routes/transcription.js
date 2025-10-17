const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { transcribeAudio, cleanupFile } = require('../services/audioTranscription');

const router = express.Router();

// Configuration multer pour stocker temporairement les fichiers audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../temp/audio');
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

// Configuration des fichiers acceptés
const fileFilter = (req, file, cb) => {
  // Formats audio supportés par Whisper API
  const allowedMimeTypes = [
    'audio/mp3',
    'audio/mpeg',
    'audio/mp4',
    'audio/mpga',
    'audio/m4a',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/x-m4a',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|mpeg|mp4|mpga|m4a|wav|webm|ogg)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Format audio non supporté. Formats acceptés: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // Limite à 25MB (limite de Whisper API)
  },
  fileFilter: fileFilter,
});

/**
 * GET /api/transcribe/test
 * Endpoint de test pour vérifier que la route fonctionne
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Transcription endpoint is working',
    config: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    },
    supportedFormats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg'],
    maxFileSize: '25MB',
  });
});

/**
 * POST /api/transcribe
 * Transcrit un fichier audio en texte en utilisant l'API Whisper d'OpenAI
 *
 * Body (multipart/form-data):
 * - file: Fichier audio à transcrire
 * - language: Code langue (optionnel, défaut: 'fr')
 *
 * Response:
 * {
 *   success: boolean,
 *   text?: string,
 *   error?: string,
 *   duration?: number
 * }
 */
router.post('/', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  let audioFilePath = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier audio fourni'
      });
    }

    audioFilePath = file.path;
    const language = req.body.language || 'fr'; // Langue par défaut: français

    console.log(`🎙️ Transcription demandée: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

    // Vérifier que la clé API OpenAI est configurée
    if (!process.env.OPENAI_API_KEY) {
      cleanupFile(audioFilePath);
      return res.status(500).json({
        success: false,
        error: 'Le service de transcription n\'est pas configuré (OPENAI_API_KEY manquante)'
      });
    }

    // Appeler le service de transcription
    const result = await transcribeAudio(audioFilePath, language);

    // Nettoyer le fichier temporaire
    cleanupFile(audioFilePath);

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ Transcription réussie en ${duration}ms`);
      return res.json({
        success: true,
        text: result.text,
        duration: duration,
        language: language,
      });
    } else {
      console.error(`❌ Échec de la transcription: ${result.error}`);
      return res.status(500).json({
        success: false,
        error: result.error,
        duration: duration,
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du traitement de la transcription:', error.message);

    // Nettoyer le fichier temporaire en cas d'erreur
    if (audioFilePath) {
      cleanupFile(audioFilePath);
    }

    // Gestion des erreurs spécifiques de Multer
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Fichier trop volumineux (max 25MB)'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la transcription'
    });
  }
});

module.exports = router;
