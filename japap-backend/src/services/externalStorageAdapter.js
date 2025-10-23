/**
 * Adaptateur pour le serveur de stockage externe
 * Simule le workflow à 3 phases en utilisant un serveur externe simple
 */

const axios = require('axios');
const https = require('https');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Agent HTTPS pour gérer les certificats auto-signés
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

class ExternalStorageAdapter {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret-change-me';
  }

  /**
   * Phase 1: Initier l'upload
   * Crée un enregistrement en DB et génère un token JWT temporaire
   */
  async initiateUpload(alertId, mediaType, fileSize, checksum, position = null) {
    try {
      // Validation du type de média
      const validTypes = ['IMAGE', 'AUDIO', 'VIDEO'];
      if (!validTypes.includes(mediaType)) {
        throw new Error(`Type de média invalide: ${mediaType}`);
      }

      // Créer l'enregistrement Media en DB avec status PENDING
      const media = await prisma.media.create({
        data: {
          type: mediaType,
          position: position,
          alert: {
            connect: { id: alertId },
          },
          filename: '', // Sera mis à jour après l'upload
          originalName: '', // Sera mis à jour après l'upload
          path: '', // Sera mis à jour après l'upload
          url: '', // Sera mis à jour après l'upload
          size: fileSize,
          mimeType: '', // Sera mis à jour après l'upload
          checksum: checksum,
          uploadStatus: 'PENDING',
          metadata: {
            initiatedAt: new Date().toISOString(),
          },
        },
      });

      // Générer un JWT token temporaire (expire dans 5 minutes)
      const uploadToken = jwt.sign(
        {
          mediaId: media.id,
          alertId: alertId,
          type: mediaType,
        },
        this.jwtSecret,
        { expiresIn: '5m' }
      );

      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      console.log(`✅ Media initié: ${media.id} (${mediaType})`);

      return {
        success: true,
        mediaId: media.id,
        uploadToken: uploadToken,
        expiresAt: expiresAt,
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Upload du fichier vers le serveur externe
   * Valide le token JWT, upload vers le serveur externe, met à jour la DB
   */
  async uploadFile(mediaId, uploadToken, fileBuffer, originalFilename, mimeType) {
    try {
      // 1. Valider le JWT token
      let decoded;
      try {
        decoded = jwt.verify(uploadToken, this.jwtSecret);
      } catch (err) {
        throw new Error('Token invalide ou expiré');
      }

      if (decoded.mediaId !== mediaId) {
        throw new Error('Token ne correspond pas au mediaId');
      }

      // 2. Vérifier que le media existe et est en PENDING
      const media = await prisma.media.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new Error('Media introuvable');
      }

      if (media.uploadStatus !== 'PENDING') {
        throw new Error(`Media déjà traité (status: ${media.uploadStatus})`);
      }

      // 3. Upload vers le serveur externe
      console.log(`📤 Upload vers serveur externe: ${this.baseURL}/upload`);

      const formData = new FormData();
      formData.append('image', fileBuffer, {
        filename: originalFilename,
        contentType: mimeType,
      });

      const response = await axios.post(`${this.baseURL}/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': this.apiKey,
          'User-Agent': 'JAPAP-Backend/2.0',
          Accept: 'application/json',
        },
        httpsAgent: httpsAgent,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 secondes
      });

      // 4. Vérifier la réponse
      if (!response.data || !response.data.url) {
        throw new Error('Réponse invalide du serveur externe');
      }

      // 5. Construire l'URL complète
      let mediaUrl = response.data.url;
      if (!mediaUrl.startsWith('http')) {
        mediaUrl = `${this.baseURL}${mediaUrl.startsWith('/') ? '' : '/'}${mediaUrl}`;
      }

      // 6. Mettre à jour le Media en DB
      const updatedMedia = await prisma.media.update({
        where: { id: mediaId },
        data: {
          filename: response.data.filename,
          originalName: originalFilename,
          path: response.data.url, // URL relative ou complète
          url: mediaUrl, // URL complète
          mimeType: mimeType,
          uploadStatus: 'PROCESSING',
          metadata: {
            ...(media.metadata || {}),
            uploadedAt: new Date().toISOString(),
            externalFilename: response.data.filename,
            storage: 'external',
          },
        },
      });

      console.log(`✅ Upload réussi: ${mediaUrl}`);

      return {
        success: true,
        mediaId: updatedMedia.id,
        url: mediaUrl,
        filename: response.data.filename,
        size: response.data.size,
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error.message);

      // Mettre le media en état FAILED
      if (mediaId) {
        await prisma.media
          .update({
            where: { id: mediaId },
            data: {
              uploadStatus: 'FAILED',
              metadata: {
                error: error.message,
                failedAt: new Date().toISOString(),
              },
            },
          })
          .catch((e) => console.error('Erreur lors de la mise à jour du status:', e));
      }

      throw error;
    }
  }

  /**
   * Phase 3: Finaliser l'upload
   * Marque le media comme COMPLETED, met à jour les compteurs de l'alerte
   */
  async completeUpload(mediaId, uploadToken) {
    try {
      // 1. Valider le JWT token
      let decoded;
      try {
        decoded = jwt.verify(uploadToken, this.jwtSecret);
      } catch (err) {
        throw new Error('Token invalide ou expiré');
      }

      if (decoded.mediaId !== mediaId) {
        throw new Error('Token ne correspond pas au mediaId');
      }

      // 2. Vérifier que le media existe et est PROCESSING
      const media = await prisma.media.findUnique({
        where: { id: mediaId },
        include: {
          alert: true,
        },
      });

      if (!media) {
        throw new Error('Media introuvable');
      }

      if (media.uploadStatus !== 'PROCESSING') {
        throw new Error(`Media pas prêt pour finalisation (status: ${media.uploadStatus})`);
      }

      // 3. Marquer comme COMPLETED
      const completedMedia = await prisma.media.update({
        where: { id: mediaId },
        data: {
          uploadStatus: 'COMPLETED',
          metadata: {
            ...(media.metadata || {}),
            completedAt: new Date().toISOString(),
          },
        },
      });

      // 4. Mettre à jour les compteurs de l'alerte
      if (media.alertId) {
        const alert = await prisma.alert.findUnique({
          where: { id: media.alertId },
          include: {
            media: {
              where: {
                uploadStatus: 'COMPLETED',
              },
            },
          },
        });

        if (alert) {
          const imageCount = alert.media.filter((m) => m.type === 'IMAGE').length;
          const hasAudio = alert.media.some((m) => m.type === 'AUDIO');
          const hasVideo = alert.media.some((m) => m.type === 'VIDEO');

          await prisma.alert.update({
            where: { id: media.alertId },
            data: {
              imageCount: imageCount,
              hasAudio: hasAudio,
              hasVideo: hasVideo,
            },
          });

          console.log(
            `✅ Alerte ${media.alertId} mise à jour: ${imageCount} images, audio=${hasAudio}, video=${hasVideo}`
          );
        }
      }

      console.log(`✅ Media finalisé: ${mediaId}`);

      return {
        success: true,
        media: completedMedia,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      throw error;
    }
  }

  /**
   * Fonction helper: Upload complet en une fois (pour tests)
   */
  async uploadComplete(alertId, fileBuffer, originalFilename, mimeType, mediaType, position = null) {
    try {
      // Calculer le checksum
      const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

      // Phase 1: Initiate
      const initResult = await this.initiateUpload(
        alertId,
        mediaType,
        fileBuffer.length,
        checksum,
        position
      );

      // Phase 2: Upload
      const uploadResult = await this.uploadFile(
        initResult.mediaId,
        initResult.uploadToken,
        fileBuffer,
        originalFilename,
        mimeType
      );

      // Phase 3: Complete
      const completeResult = await this.completeUpload(initResult.mediaId, initResult.uploadToken);

      return completeResult.media;
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload complet:', error);
      throw error;
    }
  }

  /**
   * Tester la connexion au serveur externe
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/`, {
        headers: {
          'x-api-key': this.apiKey,
        },
        httpsAgent: httpsAgent,
        timeout: 5000,
      });

      return {
        success: true,
        message: 'Serveur externe accessible',
        serverInfo: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Serveur externe inaccessible',
        error: error.message,
      };
    }
  }
}

module.exports = ExternalStorageAdapter;
