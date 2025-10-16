import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

// Récupérer l'URL de base sans le /api
const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
  // Enlever le /api à la fin si présent
  return url.replace(/\/api$/, '');
};

const API_BASE_URL = getBaseUrl();

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Demande les permissions pour accéder à la galerie
 */
async function requestGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Vous devez autoriser l\'accès à la galerie pour sélectionner une image.'
      );
      return false;
    }
  }
  return true;
}

/**
 * Demande les permissions pour accéder à la caméra
 */
async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Vous devez autoriser l\'accès à la caméra pour prendre une photo.'
      );
      return false;
    }
  }
  return true;
}

/**
 * Sélectionne une image depuis la galerie
 */
export async function pickImageFromGallery(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8, // Compression à 80%
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Erreur lors de la sélection de l\'image:', error);
    Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    return null;
  }
}

/**
 * Prend une photo avec la caméra
 */
export async function pickImageFromCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error);
    Alert.alert('Erreur', 'Impossible de prendre la photo');
    return null;
  }
}

/**
 * Upload une image vers le serveur backend
 */
export async function uploadImage(imageUri: string): Promise<ImageUploadResult> {
  try {
    // Créer FormData
    const formData = new FormData();

    // Extraire le nom du fichier et le type MIME
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Ajouter le fichier au FormData
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    // Envoyer au backend
    console.log(`📤 Upload vers: ${API_BASE_URL}/api/upload`);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      // Ne pas définir Content-Type manuellement pour FormData
      // Le navigateur/fetch le fera automatiquement avec le boundary
    });

    // Vérifier si la réponse est du JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Réponse non-JSON:', text.substring(0, 200));
      throw new Error('Le serveur a retourné une réponse invalide (HTML au lieu de JSON)');
    }

    const data = await response.json();
    console.log('📥 Réponse serveur:', data);

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Erreur HTTP ${response.status}`);
    }

    return {
      success: true,
      url: data.url,
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'upload de l\'image:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Sélectionne et upload une image depuis la galerie
 */
export async function selectAndUploadFromGallery(): Promise<ImageUploadResult> {
  const image = await pickImageFromGallery();
  if (!image) {
    return { success: false, error: 'Aucune image sélectionnée' };
  }

  return await uploadImage(image.uri);
}

/**
 * Prend et upload une photo depuis la caméra
 */
export async function captureAndUploadFromCamera(): Promise<ImageUploadResult> {
  const image = await pickImageFromCamera();
  if (!image) {
    return { success: false, error: 'Aucune photo prise' };
  }

  return await uploadImage(image.uri);
}
