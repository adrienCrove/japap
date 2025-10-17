// Utilitaires pour l'enrichissement des alertes
import { EnhancedLocation, IncidentContext, UrgencyAssessment, VerificationData } from './enhanced-alert-types';

/**
 * Calcule la priorité d'une alerte basée sur plusieurs facteurs
 */
export function calculateAlertPriority(
  severity: 'low' | 'medium' | 'high' | 'critical',
  category: string,
  context?: IncidentContext,
  location?: EnhancedLocation
): UrgencyAssessment {
  let basePriority: 1 | 2 | 3 | 4 | 5;
  
  // Priorité de base selon la gravité
  switch (severity) {
    case 'critical': basePriority = 1; break;
    case 'high': basePriority = 2; break;
    case 'medium': basePriority = 3; break;
    case 'low': basePriority = 4; break;
    default: basePriority = 5;
  }
  
  // Ajustements selon la catégorie
  const categoryModifiers: Record<string, number> = {
    'Urgence médicale': -1,
    'Accident de circulation': -1,
    'Incendie': -1,
    'Agression': 0,
    'Vol': 1,
    'Cambriolage': 1,
    'Panne ou coupure': 1,
    'Autre': 1
  };
  
  let adjustedPriority = basePriority + (categoryModifiers[category] || 0);
  
  // Ajustements selon le contexte
  if (context?.weather?.condition === 'storm') adjustedPriority -= 1;
  if (context?.traffic?.level === 'jam') adjustedPriority -= 1;
  if (context?.demographics?.vulnerablePopulation) adjustedPriority -= 1;
  if (context?.events?.expectedAttendance && context.events.expectedAttendance > 1000) {
    adjustedPriority -= 1;
  }
  
  // Limiter entre 1 et 5
  const finalPriority = Math.max(1, Math.min(5, adjustedPriority)) as 1 | 2 | 3 | 4 | 5;
  
  // Déterminer l'impact estimé
  let estimatedImpact: 'local' | 'district' | 'city' | 'regional' = 'local';
  if (category === 'Catastrophe naturelle' || finalPriority === 1) {
    estimatedImpact = context?.demographics?.populationDensity === 'very_high' ? 'regional' : 'city';
  } else if (finalPriority <= 2) {
    estimatedImpact = 'district';
  }
  
  // Ressources nécessaires selon la catégorie
  const resourcesMapping: Record<string, string[]> = {
    'Urgence médicale': ['ambulance', 'hospital'],
    'Accident de circulation': ['police', 'ambulance', 'traffic'],
    'Incendie': ['fire', 'ambulance'],
    'Agression': ['police'],
    'Vol': ['police'],
    'Cambriolage': ['police'],
    'Catastrophe naturelle': ['fire', 'police', 'civil_protection'],
    'Panne ou coupure': ['technical_services'],
    'Manifestation': ['police'],
    'Animal dangereux': ['animal_control', 'police']
  };
  
  return {
    priority: finalPriority,
    requiresImmediateAction: finalPriority <= 2,
    estimatedImpact,
    resourcesNeeded: resourcesMapping[category] || ['police'],
    estimatedResolutionTime: calculateEstimatedResolutionTime(category, finalPriority)
  };
}

/**
 * Estime le temps de résolution en minutes
 */
function calculateEstimatedResolutionTime(category: string, priority: number): number {
  const baseTime: Record<string, number> = {
    'Urgence médicale': 15,
    'Accident de circulation': 45,
    'Incendie': 60,
    'Agression': 30,
    'Vol': 120,
    'Cambriolage': 180,
    'Catastrophe naturelle': 720,
    'Panne ou coupure': 240,
    'Manifestation': 180,
    'Animal dangereux': 90
  };
  
  const base = baseTime[category] || 60;
  const priorityMultiplier = priority <= 2 ? 0.5 : priority <= 3 ? 1 : 1.5;
  
  return Math.round(base * priorityMultiplier);
}

/**
 * Enrichit les données de localisation avec Google Places
 */
export async function enrichLocationData(
  address: string,
  coordinates: { lat: number; lng: number }
): Promise<EnhancedLocation> {
  try {
    // En production, utiliser l'API Google Places ici
    const mockPlaceDetails = await mockGooglePlacesCall(coordinates);

    return {
      address,
      coordinates,
      precision: 10, // Précision estimée en mètres
      placeId: mockPlaceDetails.place_id,
      neighborhood: mockPlaceDetails.neighborhood,
      city: mockPlaceDetails.city || 'Yaoundé',
      region: mockPlaceDetails.region || 'Centre',
      postalCode: mockPlaceDetails.postal_code,
      landmark: mockPlaceDetails.landmark,
      isValidated: true,
      validationSource: 'google_places'
    };
  } catch (error) {
    console.error('Erreur enrichissement localisation:', error);

    // Fallback avec données minimales
    return {
      address,
      coordinates,
      city: 'Yaoundé', // Valeur par défaut
      region: 'Centre', // Valeur par défaut
      isValidated: false,
      validationSource: 'manual'
    };
  }
}

/**
 * Mock de l'appel Google Places (remplacer par vraie API)
 */
async function mockGooglePlacesCall(coordinates: { lat: number; lng: number }) {
  // Simulation d'un appel API
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    place_id: `place_${coordinates.lat}_${coordinates.lng}`,
    neighborhood: 'Centre-ville',
    city: 'Yaoundé',
    region: 'Centre',
    postal_code: undefined,
    landmark: 'Près du marché central'
  };
}

/**
 * Calcule le score de confiance d'une alerte
 */
export function calculateConfidenceScore(
  reporterTrustLevel: 'low' | 'medium' | 'high' | 'verified',
  hasMedia: boolean,
  locationPrecision?: number,
  confirmations: number = 0
): number {
  let score = 0;
  
  // Score de base selon le rapporteur
  const trustScores = {
    'low': 20,
    'medium': 40,
    'high': 60,
    'verified': 80
  };
  score += trustScores[reporterTrustLevel];
  
  // Bonus pour les médias
  if (hasMedia) score += 15;
  
  // Bonus pour la précision de localisation
  if (locationPrecision && locationPrecision <= 10) score += 10;
  else if (locationPrecision && locationPrecision <= 50) score += 5;
  
  // Bonus pour les confirmations
  score += Math.min(confirmations * 5, 25);
  
  return Math.min(100, score);
}

/**
 * Détermine le contexte météo (à connecter à une API météo)
 */
export async function getWeatherContext(coordinates: { lat: number; lng: number }): Promise<IncidentContext['weather']> {
  try {
    // En production, connecter à OpenWeatherMap ou similar
    const mockWeather = await mockWeatherCall(coordinates);

    return {
      condition: mockWeather.condition,
      temperature: mockWeather.temperature,
      visibility: mockWeather.visibility
    };
  } catch {
    return undefined;
  }
}

async function mockWeatherCall(coordinates: { lat: number; lng: number }) {
  await new Promise(resolve => setTimeout(resolve, 50));

  // Mock data pour Yaoundé
  return {
    condition: 'sunny',
    temperature: 28,
    visibility: 'good'
  };
}

/**
 * Génère une référence d'alerte enrichie
 */
export function generateEnhancedAlertRef(
  category: string,
  priority: number,
  region: string = 'CM'
): string {
  const categoryPrefixes: Record<string, string> = {
    'Accident de circulation': 'ACC',
    'Agression': 'ASS',
    'Vol': 'TH',
    'Cambriolage': 'BRG',
    'Disparition': 'DIS',
    'Catastrophe naturelle': 'NAT',
    'Incendie': 'FIR',
    'Panne ou coupure': 'OUT',
    'Manifestation': 'MAN',
    'Animal dangereux': 'ANI',
    'Urgence médicale': 'MED',
    'Autre': 'OTH'
  };
  
  const prefix = categoryPrefixes[category] || 'GEN';
  const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  
  return `${region}-${prefix}-P${priority}-${timestamp}-${randomSuffix}`;
}

/**
 * Valide la cohérence des données d'alerte
 */
export function validateAlertData(alertData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validations basiques
  if (!alertData.category) errors.push('Catégorie requise');
  if (!alertData.description?.trim()) errors.push('Description requise');
  if (!alertData.location?.address?.trim()) errors.push('Adresse requise');

  // Validations coordonnées (format objet)
  const lat = alertData.location?.coordinates?.lat || 0;
  const lng = alertData.location?.coordinates?.lng || 0;
  if (lat === 0 && lng === 0) errors.push('Coordonnées GPS requises');
  if (lat < -90 || lat > 90) errors.push('Latitude invalide');
  if (lng < -180 || lng > 180) errors.push('Longitude invalide');

  // Validation Cameroun (approximative)
  if (lat < 1.5 || lat > 13.5 || lng < 8.5 || lng > 16.5) {
    errors.push('Les coordonnées semblent être en dehors du Cameroun');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
