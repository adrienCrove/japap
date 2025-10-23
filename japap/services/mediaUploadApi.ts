/**
 * Media Upload API Service
 * Three-phase upload workflow: initiate → upload → complete
 */

import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/services/storage';
import { validateMedia, calculateChecksum, MediaType } from '@/utils/mediaValidation';

// ============ TYPES ============

export interface MediaInitiateRequest {
  type: MediaType;
  position?: number; // 1-3 for images, null for audio/video
  filename: string;
  mimeType: string;
  size: number;
  checksum?: string;
  capturedAt?: string;
  metadata?: Record<string, any>;
}

export interface MediaInitiateResponse {
  success: boolean;
  mediaId: string;
  uploadUrl: string;
  uploadToken: string;
  expiresAt: string;
  message: string;
  errors?: string[];
}

export interface MediaUploadResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface MediaCompleteResponse {
  success: boolean;
  mediaId: string;
  uploadStatus: string;
  jobsQueued: string[];
  message: string;
  media: {
    id: string;
    type: MediaType;
    position: number | null;
    url: string;
    size: number;
    checksum: string;
  };
}

export interface UploadProgress {
  mediaId: string;
  position?: number;
  phase: 'validating' | 'initiating' | 'uploading' | 'completing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  error?: string;
}

// ============ API FUNCTIONS ============

/**
 * Phase 1: Initiate media upload
 * Reserve a slot and get upload token
 */
export async function initiateMediaUpload(
  alertId: string,
  request: MediaInitiateRequest
): Promise<MediaInitiateResponse> {
  try {
    // IMPORTANT: Utiliser le nouveau endpoint avec serveur externe (pas de jobs async)
    const response = await fetch(`${API_BASE_URL}/media-upload/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alertId: alertId,
        mediaType: request.type,
        fileSize: request.size,
        checksum: request.checksum,
        position: request.position,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error initiating media upload:', error);
    throw new Error(error.message || 'Erreur lors de l\'initiation de l\'upload');
  }
}

/**
 * Phase 2: Upload media file
 * Upload the binary file to the presigned URL
 */
export async function uploadMediaFile(
  mediaId: string,
  uploadToken: string,
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<MediaUploadResponse> {
  try {
    // Use Expo FileSystem uploadAsync with MULTIPART (nouveau endpoint)
    const uploadResult = await FileSystem.uploadAsync(
      `${API_BASE_URL}/media-upload/presigned/${mediaId}`,
      fileUri,
      {
        httpMethod: 'PUT',
        headers: {
          Authorization: `Bearer ${uploadToken}`,
        },
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file', // Important: fieldName must match backend expectation
      }
    );

    // Parse response
    const data = JSON.parse(uploadResult.body);

    if (uploadResult.status !== 200) {
      throw new Error(data.error || `HTTP ${uploadResult.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error uploading media file:', error);
    throw new Error(error.message || 'Erreur lors de l\'upload du fichier');
  }
}

/**
 * Phase 3: Complete media upload
 * Finalize the upload and trigger async jobs
 */
export async function completeMediaUpload(
  alertId: string,
  mediaId: string,
  uploadToken: string
): Promise<MediaCompleteResponse> {
  try {
    // IMPORTANT: Utiliser le nouveau endpoint (pas de jobs async)
    const response = await fetch(`${API_BASE_URL}/media-upload/complete/${mediaId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uploadToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error completing media upload:', error);
    throw new Error(error.message || 'Erreur lors de la finalisation de l\'upload');
  }
}

// ============ HIGH-LEVEL WORKFLOW ============

/**
 * Upload a single media file (complete workflow)
 */
export async function uploadMedia(
  alertId: string,
  fileUri: string,
  type: MediaType,
  position?: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<MediaCompleteResponse> {
  try {
    // Phase 0: Validate
    onProgress?.({
      mediaId: '',
      position,
      phase: 'validating',
      progress: 0,
      message: 'Validation du fichier...',
    });

    const validation = await validateMedia(fileUri, type);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Fichier introuvable');
    }

    const filename = fileUri.split('/').pop() || 'file';
    const size = fileInfo.size || 0;
    const mimeType = validation.metadata?.mimeType || 'application/octet-stream';

    // Calculate checksum (optional, can be slow on mobile)
    // const checksum = await calculateChecksum(fileUri);

    // Phase 1: Initiate
    onProgress?.({
      mediaId: '',
      position,
      phase: 'initiating',
      progress: 10,
      message: 'Réservation du slot...',
    });

    const initiateResponse = await initiateMediaUpload(alertId, {
      type,
      position,
      filename,
      mimeType,
      size,
      // checksum, // Optional
      capturedAt: new Date().toISOString(),
      metadata: validation.metadata,
    });

    const { mediaId, uploadToken } = initiateResponse;

    // Phase 2: Upload
    onProgress?.({
      mediaId,
      position,
      phase: 'uploading',
      progress: 30,
      message: 'Upload en cours...',
    });

    await uploadMediaFile(mediaId, uploadToken, fileUri, (uploadProgress) => {
      onProgress?.({
        mediaId,
        position,
        phase: 'uploading',
        progress: 30 + Math.round(uploadProgress * 0.5), // 30-80%
        message: `Upload: ${Math.round(uploadProgress)}%`,
      });
    });

    // Phase 3: Complete
    onProgress?.({
      mediaId,
      position,
      phase: 'completing',
      progress: 90,
      message: 'Finalisation...',
    });

    const completeResponse = await completeMediaUpload(alertId, mediaId, uploadToken);

    // Done
    onProgress?.({
      mediaId,
      position,
      phase: 'completed',
      progress: 100,
      message: 'Upload terminé !',
    });

    return completeResponse;
  } catch (error: any) {
    onProgress?.({
      mediaId: '',
      position,
      phase: 'failed',
      progress: 0,
      message: 'Échec de l\'upload',
      error: error.message,
    });
    throw error;
  }
}

/**
 * Upload multiple images (up to 3)
 */
export async function uploadMultipleImages(
  alertId: string,
  imageUris: string[],
  onProgress?: (overall: number, uploads: UploadProgress[]) => void
): Promise<MediaCompleteResponse[]> {
  if (imageUris.length === 0) {
    throw new Error('Aucune image sélectionnée');
  }

  if (imageUris.length > 3) {
    throw new Error('Maximum 3 images autorisées');
  }

  const results: MediaCompleteResponse[] = [];
  const uploadProgresses: UploadProgress[] = imageUris.map((_, index) => ({
    mediaId: '',
    position: index + 1,
    phase: 'validating',
    progress: 0,
    message: 'En attente...',
  }));

  try {
    // Upload images sequentially (to avoid overwhelming the server)
    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];
      const position = i + 1;

      const result = await uploadMedia(alertId, imageUri, 'IMAGE', position, (progress) => {
        // Update individual progress
        uploadProgresses[i] = progress;

        // Calculate overall progress
        const overallProgress = Math.round(
          uploadProgresses.reduce((sum, p) => sum + p.progress, 0) / imageUris.length
        );

        onProgress?.(overallProgress, [...uploadProgresses]);
      });

      results.push(result);
    }

    return results;
  } catch (error: any) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}

// ============ DELETE MEDIA ============

/**
 * Delete a media file
 */
export async function deleteMedia(alertId: string, mediaId: string): Promise<{ success: boolean }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error deleting media:', error);
    throw new Error(error.message || 'Erreur lors de la suppression du média');
  }
}

// ============ GET MEDIA ============

/**
 * Get all media for an alert
 */
export async function getAlertMedia(alertId: string): Promise<any[]> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/media`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data.media || [];
  } catch (error: any) {
    console.error('Error getting alert media:', error);
    throw new Error(error.message || 'Erreur lors de la récupération des médias');
  }
}
