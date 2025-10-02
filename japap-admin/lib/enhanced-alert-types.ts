// Types améliorés pour les alertes
// Phase 1 : Améliorations critiques

export interface EnhancedLocation {
  // Données existantes
  address: string;
  coordinates: [number, number];
  
  // Nouvelles données géographiques
  precision?: number;           // Précision GPS en mètres
  placeId?: string;            // Google Place ID pour référence unique
  neighborhood?: string;        // Quartier/zone
  city: string;                // Ville (obligatoire)
  region: string;              // Région (obligatoire)
  postalCode?: string;         // Code postal
  landmark?: string;           // Point de repère proche
  accessInstructions?: string; // Instructions d'accès détaillées
  
  // Validation géographique
  isValidated: boolean;        // Coordonnées validées
  validationSource: 'gps' | 'manual' | 'google_places';
}

export interface TemporalMetadata {
  reportedAt: string;          // Heure du signalement (ISO string)
  incidentDateTime?: string;   // Heure réelle de l'incident si différente
  estimatedDuration?: number;  // Durée estimée en minutes
  lastUpdatedAt: string;       // Dernière mise à jour
  resolvedAt?: string;         // Heure de résolution
  responseTime?: number;       // Temps de réponse en minutes
}

export interface ReporterContext {
  isVerified: boolean;         // Utilisateur vérifié
  reportingHistory: number;    // Nombre de signalements précédents
  accuracyRate: number;        // Taux de précision historique (0-100)
  trustLevel: 'low' | 'medium' | 'high' | 'verified';
}

export interface IncidentContext {
  weather?: {
    condition: string;         // 'sunny', 'rainy', 'storm', etc.
    temperature?: number;      // Température en Celsius
    visibility?: string;       // 'good', 'poor', 'very_poor'
  };
  traffic?: {
    level: 'light' | 'moderate' | 'heavy' | 'jam';
    mainRoutes: string[];      // Routes principales affectées
  };
  events?: {
    type?: string;             // 'match', 'festival', 'parade', etc.
    name?: string;             // Nom de l'événement
    expectedAttendance?: number;
  };
  demographics?: {
    populationDensity: 'low' | 'medium' | 'high' | 'very_high';
    vulnerablePopulation?: boolean; // Présence d'écoles, hôpitaux, etc.
  };
}

export interface UrgencyAssessment {
  priority: 1 | 2 | 3 | 4 | 5;  // 1 = critique, 5 = faible
  requiresImmediateAction: boolean;
  estimatedImpact: 'local' | 'district' | 'city' | 'regional';
  resourcesNeeded: string[];     // ['police', 'ambulance', 'fire', 'traffic']
  estimatedResolutionTime?: number; // Minutes
}

export interface VerificationData {
  isVerified: boolean;
  verificationMethod?: 'auto' | 'manual' | 'crowdsourced' | 'official_source';
  verifiedBy?: string;           // ID de l'admin/système qui a vérifié
  verifiedAt?: string;
  confidenceScore: number;       // Score de confiance 0-100
  
  // Sources de confirmation
  confirmationSources: Array<{
    type: 'user_report' | 'official_source' | 'media' | 'sensor';
    source: string;
    timestamp: string;
    reliability: number;         // 0-100
  }>;
}

export interface ModerationData {
  status: 'clean' | 'flagged' | 'reviewing' | 'spam' | 'false_alarm';
  flaggedCount: number;          // Nombre de signalements abusifs
  flags: Array<{
    type: 'spam' | 'inappropriate' | 'false_info' | 'duplicate';
    reportedBy: string;
    timestamp: string;
    reason?: string;
  }>;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationNotes?: string;
  autoModerationScore?: number;  // Score automatique 0-100
}

// Type principal enrichi
export interface EnhancedAlert {
  // Champs existants (inchangés)
  id: string;
  ref_alert_id: string;
  category: string;
  title: string;
  displayTitle: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'pending' | 'expired' | 'false' | 'resolved';
  description: string;
  mediaUrl?: string;
  source: 'app' | 'whatsapp' | 'telegram' | 'web' | 'manual';
  
  // Champs enrichis
  location: EnhancedLocation;
  temporal: TemporalMetadata;
  reporter?: ReporterContext;
  context?: IncidentContext;
  urgency: UrgencyAssessment;
  verification: VerificationData;
  moderation: ModerationData;
  
  // Métadonnées système
  createdAt: string;
  updatedAt: string;
  version: number;               // Versioning pour les modifications
}

// Type pour la création d'alertes enrichies
export type EnhancedAlertCreationData = Omit<
  EnhancedAlert, 
  'id' | 'ref_alert_id' | 'createdAt' | 'updatedAt' | 'version'
> & {
  // Champs optionnels à la création
  reporter?: Partial<ReporterContext>;
  context?: Partial<IncidentContext>;
  verification?: Partial<VerificationData>;
  moderation?: Partial<ModerationData>;
};
