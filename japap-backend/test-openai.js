// Script de test pour vérifier la clé API OpenAI
require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAIKey() {
  console.log('🔍 Test de la clé API OpenAI...\n');

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY n\'est pas définie dans .env');
    return;
  }

  console.log('✅ Clé API trouvée dans .env');
  console.log(`📝 Clé commence par: ${apiKey.substring(0, 20)}...`);
  console.log(`📝 Clé se termine par: ...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`📏 Longueur de la clé: ${apiKey.length} caractères\n`);

  try {
    console.log('🔄 Test de connexion à OpenAI...');
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Test simple : lister les modèles disponibles
    const models = await openai.models.list();

    console.log('✅ Connexion réussie !');
    console.log(`📊 Nombre de modèles disponibles: ${models.data.length}`);

    // Vérifier si Whisper est disponible
    const whisperModel = models.data.find(m => m.id === 'whisper-1');
    if (whisperModel) {
      console.log('✅ Modèle Whisper-1 disponible !');
    } else {
      console.log('⚠️  Modèle Whisper-1 non trouvé');
    }

    console.log('\n🎉 La clé API est VALIDE et fonctionnelle !');

  } catch (error) {
    console.error('\n❌ ERREUR lors du test:');
    console.error(`Code: ${error.status || 'N/A'}`);
    console.error(`Message: ${error.message}`);

    if (error.status === 401) {
      console.error('\n💡 La clé API est INVALIDE. Actions à faire:');
      console.error('   1. Vérifiez que vous avez copié la clé complète');
      console.error('   2. Créez une nouvelle clé sur https://platform.openai.com/api-keys');
      console.error('   3. Vérifiez que votre compte OpenAI a du crédit');
    } else if (error.status === 429) {
      console.error('\n💡 Limite de taux atteinte. Attendez quelques secondes et réessayez.');
    }
  }
}

testOpenAIKey();
