// Définition des catégories d'alertes
// Source: inspiré de japap-admin/lib/enhanced-categories.ts

export interface CategoryInfo {
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  defaultSeverity: 'critical' | 'high' | 'medium' | 'low';
  responseTime: number; // en minutes
  expirationHours: number | null;
  emergencyServices: string[];
  keywords: string[];
}

// Liste des catégories principales
export const CATEGORIES: CategoryInfo[] = [
  // URGENCES VITALES (Critical)
  {
    code: 'MEDC',
    name: 'Urgence médicale critique',
    description: 'Situation médicale nécessitant une intervention immédiate (arrêt cardiaque, hémorragie massive, accident grave)',
    icon: '🚑',
    color: '#dc2626',
    priority: 'critical',
    defaultSeverity: 'critical',
    responseTime: 5,
    expirationHours: 2,
    emergencyServices: ['SAMU', 'Pompiers'],
    keywords: ['urgence', 'médical', 'blessé', 'grave', 'mort', 'accident'],
  },
  {
    code: 'FIRV',
    name: 'Incendie avec victimes',
    description: 'Feu actif avec présence de victimes ou risque imminent pour des vies humaines',
    icon: '🔥',
    color: '#dc2626',
    priority: 'critical',
    defaultSeverity: 'critical',
    responseTime: 5,
    expirationHours: 2,
    emergencyServices: ['Pompiers', 'SAMU', 'Police'],
    keywords: ['feu', 'incendie', 'flammes', 'victimes', 'brûlé'],
  },

  // URGENCES SÉCURITAIRES (High)
  {
    code: 'ASGC',
    name: 'Agression en cours',
    description: 'Attaque, violence physique ou agression actuellement en cours',
    icon: '⚠️',
    color: '#ea580c',
    priority: 'high',
    defaultSeverity: 'high',
    responseTime: 10,
    expirationHours: 4,
    emergencyServices: ['Police', 'Gendarmerie', 'SAMU'],
    keywords: ['agression', 'attaque', 'violence', 'coup', 'blessé'],
  },
  {
    code: 'ACCG',
    name: 'Accident grave de circulation',
    description: 'Accident de la route avec blessés graves, véhicules impliqués multiples ou route bloquée',
    icon: '🚗',
    color: '#ea580c',
    priority: 'high',
    defaultSeverity: 'high',
    responseTime: 10,
    expirationHours: 3,
    emergencyServices: ['Police', 'Pompiers', 'SAMU'],
    keywords: ['accident', 'collision', 'route', 'blessé', 'véhicule'],
  },

  // ALERTES COMMUNAUTAIRES (Medium)
  {
    code: 'VOL',
    name: 'Vol / Cambriolage',
    description: 'Vol en cours ou récent, cambriolage de domicile ou commerce',
    icon: '🥷',
    color: '#f59e0b',
    priority: 'medium',
    defaultSeverity: 'medium',
    responseTime: 15,
    expirationHours: 12,
    emergencyServices: ['Police', 'Gendarmerie'],
    keywords: ['vol', 'cambriolage', 'voleur', 'volé', 'vole'],
  },
  {
    code: 'DISC',
    name: 'Disparition / Personne recherchée',
    description: 'Personne portée disparue ou recherchée par les autorités',
    icon: '👤',
    color: '#f59e0b',
    priority: 'medium',
    defaultSeverity: 'medium',
    responseTime: 30,
    expirationHours: null, // Jamais expiré
    emergencyServices: ['Police', 'Gendarmerie'],
    keywords: ['disparu', 'recherché', 'perdu', 'introuvable'],
  },
  {
    code: 'FIR',
    name: 'Incendie / Feu',
    description: 'Incendie en cours sans victime connue, feu de brousse ou feu de forêt',
    icon: '🔥',
    color: '#f59e0b',
    priority: 'medium',
    defaultSeverity: 'medium',
    responseTime: 15,
    expirationHours: 6,
    emergencyServices: ['Pompiers', 'Police'],
    keywords: ['feu', 'incendie', 'flammes', 'brûle', 'fumée'],
  },

  // INFORMATIONS PUBLIQUES (Low)
  {
    code: 'EMBOU',
    name: 'Embouteillage / Circulation dense',
    description: 'Trafic dense, bouchons importants affectant la circulation',
    icon: '🚦',
    color: '#10b981',
    priority: 'low',
    defaultSeverity: 'low',
    responseTime: 60,
    expirationHours: 2,
    emergencyServices: ['Police'],
    keywords: ['embouteillage', 'bouchon', 'traffic', 'circulation'],
  },
  {
    code: 'AUT',
    name: 'Autre / Signalement divers',
    description: 'Signalement ne correspondant à aucune catégorie spécifique',
    icon: '❓',
    color: '#6b7280',
    priority: 'low',
    defaultSeverity: 'low',
    responseTime: 60,
    expirationHours: 24,
    emergencyServices: [],
    keywords: [],
  },
];

// Fonction helper pour récupérer une catégorie par code
export const getCategoryByCode = (code: string): CategoryInfo | undefined => {
  return CATEGORIES.find(cat => cat.code === code);
};

// Fonction helper pour récupérer une catégorie par nom
export const getCategoryByName = (name: string): CategoryInfo | undefined => {
  return CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};
