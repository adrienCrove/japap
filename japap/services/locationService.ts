import * as Location from 'expo-location';
import type { AlertLocation } from './api';

/**
 * Configuration pour le service de localisation
 */
const LOCATION_CONFIG = {
  // Timeout pour le géocodage inversé (5 secondes)
  reverseGeocodeTimeout: 5000,
  // Précision des coordonnées GPS affichées
  coordinatePrecision: 6,
};

/**
 * Interface pour le résultat de localisation
 */
export interface LocationResult {
  success: boolean;
  location: AlertLocation | null;
  error?: string;
  usedFallback?: boolean;
}

/**
 * Formate les coordonnées GPS en chaîne lisible
 */
function formatCoordinates(lat: number, lng: number): string {
  const latStr = lat.toFixed(LOCATION_CONFIG.coordinatePrecision);
  const lngStr = lng.toFixed(LOCATION_CONFIG.coordinatePrecision);
  return `Position GPS: ${latStr}, ${lngStr}`;
}

/**
 * Effectue un géocodage inversé sécurisé avec timeout
 * Retourne null si le géocodage échoue ou timeout
 */
async function safeReverseGeocode(
  latitude: number,
  longitude: number,
  timeoutMs: number = LOCATION_CONFIG.reverseGeocodeTimeout
): Promise<string | null> {
  try {
    console.log(`📍 Tentative de géocodage inversé pour: ${latitude}, ${longitude}`);

    // Créer une promesse de timeout
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log(`⏱️ Timeout du géocodage inversé après ${timeoutMs}ms`);
        resolve(null);
      }, timeoutMs);
    });

    // Créer la promesse de géocodage
    const geocodePromise = Location.reverseGeocodeAsync({
      latitude,
      longitude,
    }).then((addresses) => {
      if (!addresses || addresses.length === 0) {
        console.log('⚠️ Aucune adresse trouvée par le géocodage');
        return null;
      }

      const addr = addresses[0];
      const parts: string[] = [];

      // Construire l'adresse de manière intelligente
      if (addr.street) parts.push(addr.street);
      if (addr.streetNumber) parts.push(addr.streetNumber);
      if (addr.city) parts.push(addr.city);
      if (addr.region) parts.push(addr.region);
      if (addr.country) parts.push(addr.country);

      const addressStr = parts.length > 0 ? parts.join(', ') : null;

      if (addressStr) {
        console.log(`✅ Adresse trouvée: ${addressStr}`);
      } else {
        console.log('⚠️ Adresse vide après construction');
      }

      return addressStr;
    });

    // Attendre la première promesse qui se résout (géocodage ou timeout)
    const result = await Promise.race([geocodePromise, timeoutPromise]);
    return result;

  } catch (error: any) {
    // Gérer les erreurs spécifiques
    if (error.message && error.message.includes('UNAVAILABLE')) {
      console.error('❌ Service de géocodage non disponible (Google Play Services manquant ou clé API invalide)');
    } else if (error.message && error.message.includes('network')) {
      console.error('❌ Erreur réseau lors du géocodage');
    } else {
      console.error('❌ Erreur lors du géocodage inversé:', error.message);
    }
    return null;
  }
}

/**
 * Récupère la position actuelle de l'utilisateur avec adresse
 * Utilise un fallback sur les coordonnées GPS si le géocodage échoue
 *
 * @returns LocationResult avec succès, location, et informations d'erreur
 */
export async function getLocationWithAddress(): Promise<LocationResult> {
  try {
    // 1. Demander les permissions de localisation
    console.log('🔐 Demande de permission de localisation...');
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.error('❌ Permission de localisation refusée');
      return {
        success: false,
        location: null,
        error: 'Permission de localisation refusée. Veuillez autoriser l\'accès à votre position.',
      };
    }

    console.log('✅ Permission de localisation accordée');

    // 2. Récupérer la position GPS actuelle
    console.log('📍 Récupération de la position GPS...');
    const currentPosition = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = currentPosition.coords;
    console.log(`✅ Position GPS obtenue: ${latitude}, ${longitude}`);

    // 3. Tenter le géocodage inversé avec timeout
    const address = await safeReverseGeocode(latitude, longitude);

    // 4. Construire l'objet location
    let finalAddress: string;
    let usedFallback = false;

    if (address) {
      // Géocodage réussi
      finalAddress = address;
      console.log(`✅ Utilisation de l'adresse géocodée: ${finalAddress}`);
    } else {
      // Fallback sur les coordonnées GPS
      finalAddress = formatCoordinates(latitude, longitude);
      usedFallback = true;
      console.log(`⚠️ Utilisation du fallback: ${finalAddress}`);
    }

    const location: AlertLocation = {
      address: finalAddress,
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
    };

    return {
      success: true,
      location,
      usedFallback,
      error: usedFallback
        ? 'Adresse non disponible, coordonnées GPS utilisées'
        : undefined,
    };

  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération de la localisation:', error);

    return {
      success: false,
      location: null,
      error: error.message || 'Erreur lors de la récupération de la position',
    };
  }
}

/**
 * Vérifie si les permissions de localisation sont accordées
 */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

/**
 * Demande les permissions de localisation
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ Erreur lors de la demande de permission:', error);
    return false;
  }
}
