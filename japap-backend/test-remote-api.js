/**
 * Script de test pour vérifier la connexion à l'API distante
 * Usage: node test-remote-api.js
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Agent HTTPS pour gérer les certificats auto-signés
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Désactive la vérification SSL
});

const IMG_API_URL = process.env.IMG_API_URL;
const IMG_API_KEY = process.env.IMG_API_KEY;

console.log('🧪 Test de l\'API distante de stockage d\'images\n');
console.log(`URL: ${IMG_API_URL}`);
console.log(`API Key: ${IMG_API_KEY ? '✅ Configurée' : '❌ Manquante'}\n`);

async function testConnection() {
  try {
    console.log('1️⃣  Test de connexion (GET /list)...');
    const response = await axios.get(`${IMG_API_URL}/list`, {
      headers: {
        'x-api-key': IMG_API_KEY,
      },
      timeout: 10000,
    });

    console.log('✅ Connexion réussie !');
    console.log(`   Nombre d'images: ${response.data.count || 0}`);
    return true;
  } catch (error) {
    console.error('❌ Échec de connexion');
    console.error(`   Erreur: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Réponse:`, error.response.data);
    }
    return false;
  }
}

async function testUpload() {
  try {
    console.log('\n2️⃣  Test d\'upload d\'image...');

    // Créer une image de test simple (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png',
    });

    const response = await axios.post(`${IMG_API_URL}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-api-key': IMG_API_KEY,
        'Content-Type': 'multipart/form-data; boundary=-${formData.getBoundary()}',
        'Accept': 'application/json',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    console.log('✅ Upload réussi !');
    console.log(`   Filename: ${response.data.filename}`);
    console.log(`   URL: ${response.data.url}`);
    console.log(`   Size: ${response.data.size} bytes`);
    return response.data.filename;
  } catch (error) {
    console.error('❌ Échec de l\'upload');
    console.error(`   Erreur: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Réponse:`, error.response.data);
    }
    return null;
  }
}

async function testDelete(filename) {
  if (!filename) return;

  try {
    console.log('\n3️⃣  Test de suppression...');
    const response = await axios.delete(`${IMG_API_URL}/images/${filename}`, {
      headers: {
        'x-api-key': IMG_API_KEY,
      },
      timeout: 5000,
    });

    console.log('✅ Suppression réussie !');
  } catch (error) {
    console.error('❌ Échec de suppression');
    console.error(`   Erreur: ${error.message}`);
  }
}

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const isConnected = await testConnection();

  if (isConnected) {
    const uploadedFilename = await testUpload();
    await testDelete(uploadedFilename);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Tests terminés\n');
}

runTests();
