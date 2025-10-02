// Système de catégories amélioré pour JAPAP - Contexte Cameroun
// Restructuration par priorité d'intervention et spécificités locales

export interface CategoryDefinition {
  id: string;
  name: string;
  code: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  responseTime: number; // minutes
  defaultSeverity: 'critical' | 'high' | 'medium' | 'low';
  emergencyServices: string[];
  description: string;
  icon: string;
  color: string;
}

// ============ CATÉGORIES PAR NIVEAU DE PRIORITÉ ============

// 🔴 URGENCES VITALES (Intervention immédiate < 5 min)
export const CRITICAL_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'MEDC',
    name: 'Urgence médicale critique',
    code: 'MEDC',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    emergencyServices: ['SAMU', 'Hôpital_Central', 'Pompiers'],
    description: 'Arrêt cardiaque, accident grave avec blessés, urgence vitale',
    icon: '🚑',
    color: '#dc2626'
  },
  {
    id: 'FIRV',
    name: 'Incendie avec victimes',
    code: 'FIRV',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    emergencyServices: ['Pompiers', 'SAMU', 'Police'],
    description: 'Incendie en cours avec personnes en danger',
    icon: '🔥',
    color: '#dc2626'
  },
  {
    id: 'ACCG',
    name: 'Accident grave de circulation',
    code: 'ACCG',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    emergencyServices: ['Police', 'SAMU', 'Gendarmerie'],
    description: 'Accident avec victimes ou blocage axe majeur',
    icon: '🚗',
    color: '#dc2626'
  },
  {
    id: 'ASGC',
    name: 'Agression en cours',
    code: 'ASGC',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    emergencyServices: ['Police', 'Gendarmerie'],
    description: 'Agression, vol à main armée en cours',
    icon: '🚨',
    color: '#dc2626'
  },
  {
    id: 'DISC',
    name: 'Disparition critique',
    code: 'DISC',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    emergencyServices: ['Police', 'Gendarmerie', 'Protection_Civile'],
    description: 'Enlèvement présumé, disparition d\'enfant',
    icon: '👶',
    color: '#dc2626'
  }
];

// 🟠 URGENCES SÉCURITAIRES (Intervention < 15 min)
export const HIGH_PRIORITY_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'VOL',
    name: 'Vol/Cambriolage',
    code: 'VOL',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    emergencyServices: ['Police', 'Gendarmerie'],
    description: 'Vol, cambriolage, larcin',
    icon: '🥷',
    color: '#ea580c'
  },
  {
    id: 'ASS',
    name: 'Agression/Violence',
    code: 'ASS',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    emergencyServices: ['Police', 'Gendarmerie', 'SAMU'],
    description: 'Agression physique, violence domestique',
    icon: '👊',
    color: '#ea580c'
  },
  {
    id: 'DIS',
    name: 'Disparition standard',
    code: 'DIS',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    emergencyServices: ['Police', 'Gendarmerie'],
    description: 'Personne disparue sans enlèvement présumé',
    icon: '👤',
    color: '#ea580c'
  },
  {
    id: 'MANV',
    name: 'Manifestation violente',
    code: 'MANV',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    emergencyServices: ['Forces_Ordre', 'Préfecture'],
    description: 'Émeute, troubles à l\'ordre public',
    icon: '⚡',
    color: '#ea580c'
  },
  {
    id: 'MED',
    name: 'Urgence médicale standard',
    code: 'MED',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    emergencyServices: ['SAMU', 'Hôpital'],
    description: 'Urgence médicale sans danger immédiat',
    icon: '🏥',
    color: '#ea580c'
  },
  {
    id: 'EPI',
    name: 'Épidémie/Maladie contagieuse',
    code: 'EPI',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    emergencyServices: ['MINSANTE', 'OMS', 'Préfecture'],
    description: 'Maladie contagieuse, épidémie suspectée',
    icon: '🦠',
    color: '#ea580c'
  }
];

// 🟡 ALERTES COMMUNAUTAIRES (Intervention < 30 min)
export const MEDIUM_PRIORITY_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'INON',
    name: 'Inondation',
    code: 'INON',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['Protection_Civile', 'Mairie', 'Préfecture'],
    description: 'Inondation, débordement cours d\'eau',
    icon: '🌊',
    color: '#d97706'
  },
  {
    id: 'GLIS',
    name: 'Glissement de terrain',
    code: 'GLIS',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['Protection_Civile', 'Génie_Civil', 'Préfecture'],
    description: 'Éboulement, glissement de terrain',
    icon: '⛰️',
    color: '#d97706'
  },
  {
    id: 'FIR',
    name: 'Incendie domestique/commercial',
    code: 'FIR',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['Pompiers', 'Police'],
    description: 'Incendie sans victimes connues',
    icon: '🔥',
    color: '#d97706'
  },
  {
    id: 'FORF',
    name: 'Incendie de forêt',
    code: 'FORF',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['Pompiers', 'MINFOF', 'Protection_Civile'],
    description: 'Feu de brousse, incendie forestier',
    icon: '🌲',
    color: '#d97706'
  },
  {
    id: 'ACCL',
    name: 'Accident de circulation léger',
    code: 'ACCL',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['Police', 'Gendarmerie'],
    description: 'Accident matériel sans blessés',
    icon: '🚙',
    color: '#d97706'
  },
  {
    id: 'JAM',
    name: 'Embouteillage exceptionnel',
    code: 'JAM',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['Police', 'Circulation'],
    description: 'Bouchon majeur, circulation bloquée',
    icon: '🚦',
    color: '#d97706'
  },
  {
    id: 'ELEC',
    name: 'Panne électrique',
    code: 'ELEC',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['ENEO', 'Mairie'],
    description: 'Coupure électricité, panne transformateur',
    icon: '⚡',
    color: '#d97706'
  },
  {
    id: 'EAU',
    name: 'Panne d\'eau',
    code: 'EAU',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['CAMWATER', 'Mairie'],
    description: 'Coupure eau, fuite majeure',
    icon: '💧',
    color: '#d97706'
  },
  {
    id: 'ANI',
    name: 'Animal sauvage en zone urbaine',
    code: 'ANI',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['MINFOF', 'Police', 'Vétérinaires'],
    description: 'Animal dangereux, faune sauvage',
    icon: '🦒',
    color: '#d97706'
  },
  {
    id: 'ROU',
    name: 'Route/Pont endommagé',
    code: 'ROU',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    emergencyServices: ['MINTP', 'Mairie', 'Police'],
    description: 'Infrastructure routière dégradée',
    icon: '🛣️',
    color: '#d97706'
  }
];

// 🟢 INFORMATIONS PUBLIQUES (Traitement différé)
export const LOW_PRIORITY_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'MANP',
    name: 'Manifestation pacifique',
    code: 'MANP',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    emergencyServices: ['Police', 'Préfecture'],
    description: 'Rassemblement pacifique, marche',
    icon: '✊',
    color: '#16a34a'
  },
  {
    id: 'ENV',
    name: 'Incident environnemental',
    code: 'ENV',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    emergencyServices: ['MINEPDED', 'Mairie'],
    description: 'Pollution, nuisances environnementales',
    icon: '🌱',
    color: '#16a34a'
  },
  {
    id: 'TEL',
    name: 'Panne télécommunications',
    code: 'TEL',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    emergencyServices: ['ART', 'Opérateurs'],
    description: 'Panne réseau mobile, internet',
    icon: '📶',
    color: '#16a34a'
  },
  {
    id: 'COM',
    name: 'Événement communautaire',
    code: 'COM',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    emergencyServices: ['Mairie', 'Chefferie'],
    description: 'Rassemblement, cérémonie, événement',
    icon: '🎉',
    color: '#16a34a'
  },
  {
    id: 'SUS',
    name: 'Événement suspect',
    code: 'SUS',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    emergencyServices: ['Police'],
    description: 'Activité suspecte, comportement anormal',
    icon: '🔍',
    color: '#16a34a'
  },
  {
    id: 'AUT',
    name: 'Autre urgence',
    code: 'AUT',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    emergencyServices: ['Police', 'Mairie'],
    description: 'Autre type d\'incident non classé',
    icon: '❓',
    color: '#16a34a'
  }
];

// ============ MATRICE DE GRAVITÉ DYNAMIQUE ============

export const SEVERITY_MATRIX: Record<'critical' | 'high' | 'medium' | 'low', string[]> = {
  // Critique - Danger immédiat de mort
  critical: ['MEDC', 'FIRV', 'ACCG', 'ASGC', 'DISC', 'INON', 'GLIS', 'EPI'],
  
  // Élevée - Intervention urgente requise
  high: ['MED', 'FIR', 'FORF', 'VOL', 'ASS', 'DIS', 'MANV', 'ANI'],
  
  // Moyenne - Intervention nécessaire
  medium: ['ACCL', 'JAM', 'ELEC', 'EAU', 'ROU', 'MANP', 'ENV'],
  
  // Faible - Information/Surveillance
  low: ['TEL', 'COM', 'SUS', 'AUT']
};

// ============ SYSTÈME DE ROUTAGE AUTOMATIQUE ============

export const ROUTING_MATRIX: Record<string, string[]> = {
  // Urgences vitales
  'MEDC': ['SAMU', 'Hôpital_Central', 'Pompiers', 'Admin_Santé'],
  'FIRV': ['Pompiers', 'SAMU', 'Police', 'Protection_Civile'],
  'ACCG': ['Police', 'SAMU', 'Gendarmerie', 'MINTP'],
  'ASGC': ['Police', 'Gendarmerie', 'BIR'],
  'DISC': ['Police', 'Gendarmerie', 'Protection_Civile', 'Préfecture'],
  
  // Urgences sécuritaires
  'VOL': ['Police', 'Gendarmerie'],
  'ASS': ['Police', 'Gendarmerie', 'SAMU'],
  'DIS': ['Police', 'Gendarmerie', 'Protection_Civile'],
  'MANV': ['Forces_Ordre', 'Préfecture', 'Admin_Territoriale'],
  'MED': ['SAMU', 'Hôpital', 'Centre_Santé'],
  'EPI': ['MINSANTE', 'OMS', 'Préfecture', 'CDC'],
  
  // Alertes communautaires
  'INON': ['Protection_Civile', 'Mairie', 'Préfecture', 'MINEPDED'],
  'GLIS': ['Protection_Civile', 'Génie_Civil', 'Préfecture'],
  'FIR': ['Pompiers', 'Police', 'Mairie'],
  'FORF': ['Pompiers', 'MINFOF', 'Protection_Civile'],
  'ACCL': ['Police', 'Gendarmerie'],
  'JAM': ['Police', 'Circulation', 'MINTP'],
  'ELEC': ['ENEO', 'Mairie', 'MINEE'],
  'EAU': ['CAMWATER', 'Mairie', 'MINEE'],
  'ANI': ['MINFOF', 'Police', 'Vétérinaires'],
  'ROU': ['MINTP', 'Mairie', 'Police'],
  
  // Informations publiques
  'MANP': ['Police', 'Préfecture', 'Admin_Territoriale'],
  'ENV': ['MINEPDED', 'Mairie', 'Police'],
  'TEL': ['ART', 'Opérateurs', 'MINPOSTEL'],
  'COM': ['Mairie', 'Chefferie', 'Admin_Territoriale'],
  'SUS': ['Police', 'Gendarmerie'],
  'AUT': ['Police', 'Mairie', 'Préfecture']
};

// ============ FONCTIONS UTILITAIRES ============

export function getAllCategories(): CategoryDefinition[] {
  return [
    ...CRITICAL_CATEGORIES,
    ...HIGH_PRIORITY_CATEGORIES,
    ...MEDIUM_PRIORITY_CATEGORIES,
    ...LOW_PRIORITY_CATEGORIES
  ];
}

export function getCategoriesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): CategoryDefinition[] {
  switch (priority) {
    case 'critical': return CRITICAL_CATEGORIES;
    case 'high': return HIGH_PRIORITY_CATEGORIES;
    case 'medium': return MEDIUM_PRIORITY_CATEGORIES;
    case 'low': return LOW_PRIORITY_CATEGORIES;
    default: return [];
  }
}

export function getCategoryByCode(code: string): CategoryDefinition | undefined {
  return getAllCategories().find(cat => cat.code === code);
}

export function getEmergencyServices(categoryCode: string): string[] {
  return ROUTING_MATRIX[categoryCode] || ['Police', 'Mairie'];
}

export function calculateDynamicSeverity(
  categoryCode: string,
  contextFactors: {
    hasVictims?: boolean;
    locationRisk?: 'low' | 'medium' | 'high';
    timeOfDay?: 'day' | 'night';
    weatherConditions?: 'good' | 'bad' | 'severe';
    populationDensity?: 'low' | 'medium' | 'high' | 'very_high';
  }
): 'critical' | 'high' | 'medium' | 'low' {
  const category = getCategoryByCode(categoryCode);
  if (!category) return 'low';
  
  const baseSeverity = category.defaultSeverity;
  let severityScore = getSeverityScore(baseSeverity);
  
  // Ajustements selon le contexte
  if (contextFactors.hasVictims) severityScore -= 1;
  if (contextFactors.locationRisk === 'high') severityScore -= 1;
  if (contextFactors.timeOfDay === 'night') severityScore -= 0.5;
  if (contextFactors.weatherConditions === 'severe') severityScore -= 1;
  if (contextFactors.populationDensity === 'very_high') severityScore -= 0.5;
  
  return getScoreSeverity(severityScore);
}

function getSeverityScore(severity: 'critical' | 'high' | 'medium' | 'low'): number {
  const scores = { critical: 1, high: 2, medium: 3, low: 4 };
  return scores[severity];
}

function getScoreSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score <= 1) return 'critical';
  if (score <= 2) return 'high';
  if (score <= 3) return 'medium';
  return 'low';
}

// ============ INTERFACE SIMPLIFIÉE POUR WHATSAPP/SMS ============

export const SIMPLIFIED_CATEGORIES = {
  urgent: [
    { code: 'MEDC', name: '1️⃣ Urgence médicale critique', emoji: '🚑' },
    { code: 'FIRV', name: '2️⃣ Incendie avec personnes en danger', emoji: '🔥' },
    { code: 'ACCG', name: '3️⃣ Accident grave avec blessés', emoji: '🚗' },
    { code: 'ASGC', name: '4️⃣ Agression en cours', emoji: '🚨' }
  ],
  security: [
    { code: 'VOL', name: '5️⃣ Vol/Cambriolage', emoji: '🥷' },
    { code: 'DIS', name: '6️⃣ Disparition', emoji: '👤' },
    { code: 'MANV', name: '7️⃣ Manifestation violente', emoji: '⚡' }
  ],
  community: [
    { code: 'ELEC', name: '8️⃣ Panne électricité', emoji: '⚡' },
    { code: 'EAU', name: '9️⃣ Panne eau', emoji: '💧' },
    { code: 'ROU', name: '🔟 Route bloquée', emoji: '🛣️' },
    { code: 'ANI', name: '🦒 Animal dangereux', emoji: '🦒' }
  ]
};

const enhancedCategories = {
  getAllCategories,
  getCategoriesByPriority,
  getCategoryByCode,
  getEmergencyServices,
  calculateDynamicSeverity,
  SIMPLIFIED_CATEGORIES,
  ROUTING_MATRIX,
  SEVERITY_MATRIX
};

export default enhancedCategories;
