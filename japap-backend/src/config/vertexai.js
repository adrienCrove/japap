/**
 * Vertex AI Configuration for Firebase
 * Used for Gemini 2.5 Flash Image (Nano Banana) integration
 */

const { VertexAI } = require('@google-cloud/vertexai');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  try {
    // Option 1: Using service account key file (recommended for production)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Resolve the path relative to the project root
      const credentialsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);

      admin.initializeApp({
        credential: admin.credential.cert(require(credentialsPath)),
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin initialized with service account');
    }
    // Option 2: Using default credentials (for Google Cloud environments)
    else if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
      console.log('✅ Firebase Admin initialized with default credentials');
    }
    // Option 3: For development - will use application default credentials
    else {
      console.warn('⚠️ No Firebase credentials found. Using default initialization.');
      admin.initializeApp();
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
  }
}

// Initialize Vertex AI client
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const location = process.env.VERTEX_AI_LOCATION || 'us-central1'; // Default location

if (!projectId) {
  console.error('❌ GOOGLE_CLOUD_PROJECT_ID or FIREBASE_PROJECT_ID is not set in .env file');
}

const vertexAI = new VertexAI({
  project: projectId,
  location: location,
});

// Gemini 2.5 Flash Image model configuration
const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Get Vertex AI generative model instance
 * @returns {GenerativeModel} Configured Gemini model
 */
function getGenerativeModel() {
  try {
    const model = vertexAI.getGenerativeModel({
      model: MODEL_NAME,
    });
    return model;
  } catch (error) {
    console.error('❌ Error getting generative model:', error.message);
    throw error;
  }
}

/**
 * Configuration for image enhancement
 */
const IMAGE_ENHANCEMENT_CONFIG = {
  // Categories that trigger automatic enhancement
  enhancementCategories: ['DISP', 'DECD'], // Disparition, Décès

  // Model parameters
  modelConfig: {
    temperature: 0.4, // Lower = more consistent, higher = more creative
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },

  // Safety settings
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],

  // Prompts for different use cases
  prompts: {
    portraitEnhancement: `Enhance this portrait photo to create a clear, high-definition image optimized for person identification.

Requirements:
- Improve face clarity and sharpness
- Enhance lighting and contrast for better facial feature visibility
- Reduce blur and noise
- Maintain photographic accuracy - do not alter facial features, only enhance quality
- Preserve original colors and skin tones
- Focus on making the face easily recognizable

This enhanced image will be used for missing person or deceased person identification purposes. Quality and accuracy are critical.`,
  },

  // Cost tracking
  pricing: {
    costPerImage: 0.039, // $0.039 per image (1290 tokens)
    tokensPerImage: 1290,
  },

  // Rate limiting
  rateLimits: {
    freeRequestsPerDay: 500,
    maxRequestsPerMinute: 60,
  },
};

module.exports = {
  vertexAI,
  getGenerativeModel,
  IMAGE_ENHANCEMENT_CONFIG,
  MODEL_NAME,
  admin, // Export Firebase Admin for other services
};
