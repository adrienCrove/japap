/**
 * Image Enhancement API Service
 * Handles creation of alerts with image enhancement for DISP and DECD categories
 */

import { API_BASE_URL } from '@/config/api';

export interface AlertImage {
  id: string;
  url: string;
  isEnhanced: boolean;
  originalImageId?: string;
  width: number;
  height: number;
  enhancementMetadata?: {
    model: string;
    processingTime: number;
    cost: number;
    timestamp: string;
    categoryCode: string;
  };
}

export interface AlertWithImages {
  id: string;
  ref_alert_id: string;
  category: string;
  severity: string;
  title: string;
  displayTitle: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status: string;
  mediaUrl: string;
  userId: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  images?: AlertImage[];
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
}

export interface CreateAlertWithEnhancementData {
  category: string;
  severity?: string;
  title: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  userId: string;
  source?: string;
  status?: string;
}

export interface CreateAlertWithEnhancementResponse {
  success: boolean;
  data?: AlertWithImages;
  message: string;
  enhancementStatus: 'completed' | 'skipped' | 'failed';
}

/**
 * Create alert with image enhancement (for DISP and DECD categories)
 * @param alertData - Alert data (category, title, description, location, etc.)
 * @param imageUri - Local image URI from camera/gallery
 * @returns Promise with alert data including original and enhanced images
 */
export async function createAlertWithEnhancement(
  alertData: CreateAlertWithEnhancementData,
  imageUri: string
): Promise<CreateAlertWithEnhancementResponse> {
  try {
    // Prepare FormData
    const formData = new FormData();

    // Add alert fields
    formData.append('category', alertData.category);
    formData.append('title', alertData.title);
    formData.append('description', alertData.description);
    formData.append('location', JSON.stringify(alertData.location));
    formData.append('userId', alertData.userId);

    if (alertData.severity) formData.append('severity', alertData.severity);
    if (alertData.source) formData.append('source', alertData.source);
    if (alertData.status) formData.append('status', alertData.status);

    // Add image file
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    console.log('🚀 Sending alert creation with enhancement to:', `${API_BASE_URL}/alerts/create-with-enhancement`);
    console.log('📦 Category:', alertData.category);

    // Send request
    const response = await fetch(`${API_BASE_URL}/alerts/create-with-enhancement`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type, let fetch handle it for FormData
      },
    });

    const responseText = await response.text();
    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      console.error('❌ Error response:', responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = JSON.parse(responseText);

    if (!data.success) {
      throw new Error(data.error || 'Failed to create alert with enhancement');
    }

    console.log('✅ Alert created successfully with', data.data?.images?.length || 0, 'image(s)');
    console.log('🎨 Enhancement status:', data.enhancementStatus);

    return data;

  } catch (error) {
    console.error('❌ Error creating alert with enhancement:', error);
    throw error;
  }
}

/**
 * Get alert images by alert ID
 * @param alertId - Alert ID
 * @returns Promise with alert data including all images
 */
export async function getAlertImages(alertId: string): Promise<AlertWithImages | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get alert images');
    }

    return data.data;

  } catch (error) {
    console.error('❌ Error getting alert images:', error);
    return null;
  }
}

/**
 * Get original image URL from alert
 * @param alert - Alert with images
 * @returns Original image URL or null
 */
export function getOriginalImageUrl(alert: AlertWithImages): string | null {
  if (alert.images && alert.images.length > 0) {
    const originalImage = alert.images.find(img => !img.isEnhanced);
    return originalImage?.url || null;
  }
  return alert.mediaUrl || null;
}

/**
 * Get enhanced image URL from alert
 * @param alert - Alert with images
 * @returns Enhanced image URL or null
 */
export function getEnhancedImageUrl(alert: AlertWithImages): string | null {
  if (alert.images && alert.images.length > 0) {
    const enhancedImage = alert.images.find(img => img.isEnhanced);
    return enhancedImage?.url || null;
  }
  return null;
}

/**
 * Check if alert has enhanced version
 * @param alert - Alert with images
 * @returns true if alert has enhanced image
 */
export function hasEnhancedVersion(alert: AlertWithImages): boolean {
  return alert.images?.some(img => img.isEnhanced) || false;
}

/**
 * Check if category requires image enhancement
 * @param categoryCode - Category code (e.g., "DISP", "DECD")
 * @returns true if category requires enhancement
 */
export function shouldEnhanceCategory(categoryCode: string): boolean {
  const enhancementCategories = ['DISP', 'DECD']; // Disparition, Décès
  return enhancementCategories.includes(categoryCode);
}
