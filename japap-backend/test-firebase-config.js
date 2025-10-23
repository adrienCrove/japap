/**
 * Test Firebase Vertex AI Configuration
 * This script verifies that all Firebase and Vertex AI components are properly configured
 */

require('dotenv').config();
const path = require('path');

console.log('\n========================================');
console.log('Firebase Vertex AI Configuration Test');
console.log('========================================\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
console.log('   GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID || '❌ NOT SET');
console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || '❌ NOT SET');
console.log('   GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ NOT SET');
console.log('   VERTEX_AI_LOCATION:', process.env.VERTEX_AI_LOCATION || '❌ NOT SET');
console.log('   IMAGE_ENHANCEMENT_ENABLED:', process.env.IMAGE_ENHANCEMENT_ENABLED || '❌ NOT SET');
console.log('   IMAGE_ENHANCEMENT_CATEGORIES:', process.env.IMAGE_ENHANCEMENT_CATEGORIES || '❌ NOT SET');
console.log('');

// 2. Check service account file
console.log('2. Service Account JSON File:');
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('   Path (from .env):', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('   Resolved path:', credPath);

  const fs = require('fs');
  if (fs.existsSync(credPath)) {
    console.log('   ✅ File exists');

    try {
      const creds = require(credPath);
      console.log('   ✅ Valid JSON file');
      console.log('   Service Account Details:');
      console.log('      - Type:', creds.type || '❌ Missing');
      console.log('      - Project ID:', creds.project_id || '❌ Missing');
      console.log('      - Client Email:', creds.client_email || '❌ Missing');
      console.log('      - Private Key:', creds.private_key ? '✅ Present' : '❌ Missing');
      console.log('      - Private Key ID:', creds.private_key_id || '❌ Missing');

      // Verify project ID matches
      if (creds.project_id !== process.env.GOOGLE_CLOUD_PROJECT_ID) {
        console.log('   ⚠️ WARNING: Service account project_id does not match GOOGLE_CLOUD_PROJECT_ID');
        console.log('      Service account:', creds.project_id);
        console.log('      Environment var:', process.env.GOOGLE_CLOUD_PROJECT_ID);
      }
    } catch (error) {
      console.log('   ❌ Error reading JSON file:', error.message);
    }
  } else {
    console.log('   ❌ File does not exist at path:', credPath);
  }
} else {
  console.log('   ❌ GOOGLE_APPLICATION_CREDENTIALS not set in .env');
}
console.log('');

// 3. Test Firebase Admin initialization
console.log('3. Firebase Admin SDK:');
try {
  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(require(credPath)),
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
    console.log('   ✅ Firebase Admin initialized successfully');
  } else {
    console.log('   ✅ Firebase Admin already initialized');
  }
} catch (error) {
  console.log('   ❌ Firebase Admin initialization failed:', error.message);
}
console.log('');

// 4. Test Vertex AI initialization
console.log('4. Vertex AI SDK:');
try {
  const { VertexAI } = require('@google-cloud/vertexai');
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT_ID,
    location: process.env.VERTEX_AI_LOCATION || 'us-central1',
  });
  console.log('   ✅ Vertex AI client initialized successfully');
  console.log('   Project:', process.env.GOOGLE_CLOUD_PROJECT_ID);
  console.log('   Location:', process.env.VERTEX_AI_LOCATION || 'us-central1');
} catch (error) {
  console.log('   ❌ Vertex AI initialization failed:', error.message);
}
console.log('');

// 5. Test Vertex AI config module
console.log('5. Vertex AI Config Module:');
try {
  const vertexConfig = require('./src/config/vertexai.js');
  console.log('   ✅ Vertex AI config module loaded successfully');
  console.log('   Model name:', vertexConfig.MODEL_NAME);

  try {
    const model = vertexConfig.getGenerativeModel();
    console.log('   ✅ Generative model instance created successfully');
  } catch (error) {
    console.log('   ❌ Failed to get generative model:', error.message);
  }
} catch (error) {
  console.log('   ❌ Vertex AI config module failed to load:', error.message);
}
console.log('');

// 6. Test Image Enhancement Service
console.log('6. Image Enhancement Service:');
try {
  const imageService = require('./src/services/imageEnhancementService.js');
  console.log('   ✅ Image enhancement service loaded successfully');

  const categories = process.env.IMAGE_ENHANCEMENT_CATEGORIES?.split(',') || [];
  console.log('   Enhancement enabled for categories:', categories.join(', '));

  categories.forEach(cat => {
    const shouldEnhance = imageService.shouldEnhanceImage(cat.trim());
    console.log(`      - ${cat.trim()}: ${shouldEnhance ? '✅' : '❌'}`);
  });
} catch (error) {
  console.log('   ❌ Image enhancement service failed to load:', error.message);
}
console.log('');

// 7. Summary
console.log('========================================');
console.log('Summary:');
console.log('========================================');

let allGood = true;

if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.log('❌ GOOGLE_CLOUD_PROJECT_ID is not set');
  allGood = false;
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('❌ GOOGLE_APPLICATION_CREDENTIALS is not set');
  allGood = false;
} else {
  const fs = require('fs');
  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (!fs.existsSync(credPath)) {
    console.log('❌ Service account file does not exist');
    allGood = false;
  }
}

if (!process.env.VERTEX_AI_LOCATION) {
  console.log('⚠️ VERTEX_AI_LOCATION not set (using default: us-central1)');
}

if (process.env.IMAGE_ENHANCEMENT_ENABLED !== 'true') {
  console.log('⚠️ IMAGE_ENHANCEMENT_ENABLED is not set to "true"');
}

if (allGood) {
  console.log('\n✅ All critical configuration checks passed!');
  console.log('Firebase Vertex AI is properly configured and ready to use.\n');
} else {
  console.log('\n❌ Some configuration issues need to be resolved.\n');
}

process.exit(allGood ? 0 : 1);
