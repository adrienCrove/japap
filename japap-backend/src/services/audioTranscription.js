const OpenAI = require('openai');
const fs = require('fs');

// Initialiser le client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcrit un fichier audio en texte en utilisant l'API Whisper d'OpenAI
 * @param {string} audioFilePath - Chemin vers le fichier audio
 * @param {string} language - Code langue (ex: 'fr' pour français, optionnel)
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
async function transcribeAudio(audioFilePath, language = 'fr') {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY n\'est pas configurée dans les variables d\'environnement');
    }

    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Le fichier audio n\'existe pas');
    }

    console.log(`🎙️ Début de la transcription audio: ${audioFilePath}`);

    // Créer un stream de lecture du fichier
    const audioStream = fs.createReadStream(audioFilePath);

    // Appeler l'API Whisper d'OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: language, // Spécifier la langue pour améliorer la précision
      response_format: 'json', // Format de réponse
    });

    console.log(`✅ Transcription réussie: ${transcription.text.substring(0, 100)}...`);

    return {
      success: true,
      text: transcription.text,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la transcription:', error.message);

    // Gestion des erreurs spécifiques d'OpenAI
    if (error.response) {
      return {
        success: false,
        error: `Erreur OpenAI: ${error.response.data?.error?.message || error.message}`,
      };
    }

    return {
      success: false,
      error: error.message || 'Erreur lors de la transcription',
    };
  }
}

/**
 * Nettoie un fichier temporaire
 * @param {string} filePath - Chemin du fichier à supprimer
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Fichier temporaire supprimé: ${filePath}`);
    }
  } catch (error) {
    console.error(`⚠️ Erreur lors de la suppression du fichier: ${error.message}`);
  }
}

module.exports = {
  transcribeAudio,
  cleanupFile,
};
