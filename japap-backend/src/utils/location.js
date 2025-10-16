/**
 * Utilitaires pour la normalisation des données de localisation
 * Garantit un format uniforme: { address, coordinates: { lat, lng } }
 */

/**
 * Normaliser les données de localisation vers un format standard
 * Accepte plusieurs formats en entrée et retourne toujours le format objet
 *
 * @param {Object|string} locationData - Données de localisation brutes
 * @returns {Object} - Format normalisé { address, coordinates: { lat, lng } }
 */
function normalizeLocation(locationData) {
  // Si null ou undefined
  if (!locationData) {
    return {
      address: '',
      coordinates: {
        lat: null,
        lng: null
      }
    };
  }

  // Si c'est une string (adresse simple)
  if (typeof locationData === 'string') {
    return {
      address: locationData,
      coordinates: {
        lat: null,
        lng: null
      }
    };
  }

  // Si c'est un objet, extraire les coordonnées
  const result = {
    address: locationData.address || locationData.location || '',
    coordinates: {
      lat: null,
      lng: null
    }
  };

  // Cas 1: coordinates est un array [lat, lng]
  if (Array.isArray(locationData.coordinates)) {
    if (locationData.coordinates.length >= 2) {
      result.coordinates.lat = parseFloat(locationData.coordinates[0]);
      result.coordinates.lng = parseFloat(locationData.coordinates[1]);
    }
  }
  // Cas 2: coordinates est déjà un objet {lat, lng}
  else if (locationData.coordinates && typeof locationData.coordinates === 'object') {
    result.coordinates.lat = parseFloat(locationData.coordinates.lat) || null;
    result.coordinates.lng = parseFloat(locationData.coordinates.lng) || null;
  }
  // Cas 3: latitude/longitude directement dans l'objet
  else if (locationData.latitude && locationData.longitude) {
    result.coordinates.lat = parseFloat(locationData.latitude);
    result.coordinates.lng = parseFloat(locationData.longitude);
  }
  // Cas 4: lat/lng directement dans l'objet
  else if (locationData.lat && locationData.lng) {
    result.coordinates.lat = parseFloat(locationData.lat);
    result.coordinates.lng = parseFloat(locationData.lng);
  }

  // Valider que les coordonnées sont dans les limites valides
  if (result.coordinates.lat !== null && result.coordinates.lng !== null) {
    if (isNaN(result.coordinates.lat) || isNaN(result.coordinates.lng)) {
      result.coordinates.lat = null;
      result.coordinates.lng = null;
    } else if (result.coordinates.lat < -90 || result.coordinates.lat > 90) {
      result.coordinates.lat = null;
      result.coordinates.lng = null;
    } else if (result.coordinates.lng < -180 || result.coordinates.lng > 180) {
      result.coordinates.lat = null;
      result.coordinates.lng = null;
    }
  }

  return result;
}

/**
 * Convertir les coordonnées du format objet vers format array (pour compatibilité)
 *
 * @param {Object} coordinates - { lat, lng }
 * @returns {Array} - [lat, lng]
 */
function coordinatesToArray(coordinates) {
  if (!coordinates || coordinates.lat === null || coordinates.lng === null) {
    return [0, 0];
  }
  return [parseFloat(coordinates.lat), parseFloat(coordinates.lng)];
}

/**
 * Convertir les coordonnées du format array vers format objet
 *
 * @param {Array} coordinatesArray - [lat, lng]
 * @returns {Object} - { lat, lng }
 */
function coordinatesToObject(coordinatesArray) {
  if (!Array.isArray(coordinatesArray) || coordinatesArray.length < 2) {
    return { lat: null, lng: null };
  }
  return {
    lat: parseFloat(coordinatesArray[0]),
    lng: parseFloat(coordinatesArray[1])
  };
}

/**
 * Valider si des coordonnées sont valides
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
function areCoordinatesValid(lat, lng) {
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return false;
  }
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return false;
  }

  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
}

/**
 * Créer un objet location pour Prisma (format JSON)
 * Compatible avec le champ Json de Prisma
 *
 * @param {string} address - Adresse textuelle
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} - Objet prêt pour Prisma
 */
function createPrismaLocation(address, lat, lng) {
  return {
    address: address || '',
    coordinates: {
      lat: lat !== null && lat !== undefined ? parseFloat(lat) : null,
      lng: lng !== null && lng !== undefined ? parseFloat(lng) : null
    }
  };
}

/**
 * Extraire latitude depuis n'importe quel format
 *
 * @param {*} locationData
 * @returns {number|null}
 */
function extractLat(locationData) {
  if (!locationData) return null;

  // Array format
  if (Array.isArray(locationData.coordinates)) {
    return parseFloat(locationData.coordinates[0]) || null;
  }
  // Object format
  if (locationData.coordinates?.lat) {
    return parseFloat(locationData.coordinates.lat);
  }
  // Direct properties
  if (locationData.latitude) return parseFloat(locationData.latitude);
  if (locationData.lat) return parseFloat(locationData.lat);

  return null;
}

/**
 * Extraire longitude depuis n'importe quel format
 *
 * @param {*} locationData
 * @returns {number|null}
 */
function extractLng(locationData) {
  if (!locationData) return null;

  // Array format
  if (Array.isArray(locationData.coordinates)) {
    return parseFloat(locationData.coordinates[1]) || null;
  }
  // Object format
  if (locationData.coordinates?.lng) {
    return parseFloat(locationData.coordinates.lng);
  }
  // Direct properties
  if (locationData.longitude) return parseFloat(locationData.longitude);
  if (locationData.lng) return parseFloat(locationData.lng);

  return null;
}

module.exports = {
  normalizeLocation,
  coordinatesToArray,
  coordinatesToObject,
  areCoordinatesValid,
  createPrismaLocation,
  extractLat,
  extractLng
};
