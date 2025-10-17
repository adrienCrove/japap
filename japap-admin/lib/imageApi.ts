/**
 * API Client pour la gestion des images
 * Interactions avec le backend pour l'upload et la gestion des images
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Image {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  alertId: string | null;
  userId: string | null;
  uploadedBy: string | null;
  category: string | null;
  isPublic: boolean;
  metadata: any;
  storage: string;
  createdAt: string;
  updatedAt: string;
  alert?: {
    id: string;
    title: string;
    ref_alert_id: string;
  };
  user?: {
    id: string;
    name: string;
  };
  uploader?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface UploadOptions {
  category?: 'alert' | 'user' | 'admin' | 'broadcast' | 'temp';
  entityId?: string;
  userId?: string;
  isPublic?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  images: T[];
}

/**
 * Upload une seule image
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {},
  token?: string
): Promise<Image> {
  const formData = new FormData();
  formData.append('file', file);

  // Ajouter les options au FormData
  if (options.category) formData.append('category', options.category);
  if (options.entityId) formData.append('entityId', options.entityId);
  if (options.userId) formData.append('userId', options.userId);
  if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de l\'upload');
  }

  const data = await response.json();
  return data.image;
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: File[],
  options: UploadOptions = {},
  token?: string
): Promise<{ uploaded: number; images: Image[]; errors?: any[] }> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  // Ajouter les options
  if (options.category) formData.append('category', options.category);
  if (options.entityId) formData.append('entityId', options.entityId);
  if (options.userId) formData.append('userId', options.userId);
  if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/multiple`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de l\'upload multiple');
  }

  return await response.json();
}

/**
 * Récupérer toutes les images avec pagination
 */
export async function getAllImages(
  page: number = 1,
  limit: number = 20,
  category?: string,
  token?: string
): Promise<PaginatedResponse<Image>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(category && { category }),
  });

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/images?${params.toString()}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des images');
  }

  return await response.json();
}

/**
 * Récupérer les images d'une alerte
 */
export async function getAlertImages(alertId: string, token?: string): Promise<Image[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/images/alert/${alertId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des images de l\'alerte');
  }

  const data = await response.json();
  return data.images;
}

/**
 * Récupérer une image par ID
 */
export async function getImageById(imageId: string, token?: string): Promise<Image> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/images/${imageId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération de l\'image');
  }

  const data = await response.json();
  return data.image;
}

/**
 * Mettre à jour une image
 */
export async function updateImage(
  imageId: string,
  updates: Partial<Pick<Image, 'isPublic' | 'category' | 'metadata'>>,
  token?: string
): Promise<Image> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/images/${imageId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de la mise à jour');
  }

  const data = await response.json();
  return data.image;
}

/**
 * Supprimer une image
 */
export async function deleteImage(imageId: string, token?: string): Promise<void> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/images/${imageId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de la suppression');
  }
}

/**
 * Supprimer toutes les images d'une alerte
 */
export async function deleteAlertImages(alertId: string, token?: string): Promise<number> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/images/alert/${alertId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de la suppression');
  }

  const data = await response.json();
  return data.count;
}

/**
 * Récupérer les statistiques des images
 */
export async function getImageStats(token?: string): Promise<{
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  byStorage: Array<{ storage: string; count: number }>;
  recent24h: number;
}> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/upload/images/stats`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des statistiques');
  }

  const data = await response.json();
  return data.stats;
}

/**
 * Construire l'URL complète d'une image
 */
export function getImageUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}
