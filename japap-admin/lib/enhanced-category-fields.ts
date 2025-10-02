// Champs spécifiques améliorés pour chaque catégorie d'alerte
// Adaptés au contexte camerounais avec validation et intelligence

// ============ INTERFACES DES CHAMPS SPÉCIFIQUES ============

// Urgences médicales
export interface MedicalEmergencyFields {
  emergencyType: 'accident' | 'malaise' | 'crise_cardiaque' | 'crise_epilepsie' | 'blessure_grave' | 'intoxication' | 'noyade' | 'brulure' | 'autre';
  victimCount: number;
  victimAges: Array<{
    ageRange: 'enfant' | 'adolescent' | 'adulte' | 'senior';
    gender?: 'homme' | 'femme';
    condition: 'conscient' | 'inconscient' | 'critique';
  }>;
  symptoms: string[];
  consciousness: 'conscient' | 'semi_conscient' | 'inconscient';
  breathing: 'normale' | 'difficile' | 'arretee';
  bleeding: boolean;
  pain_level?: 1 | 2 | 3 | 4 | 5;
  medicalHistory?: string;
  medications?: string;
  emergencyServicesCalled: boolean;
  ambulanceNeeded: boolean;
  hospitalPreference?: string;
  accessInstructions?: string;
}

// Accidents de circulation améliorés
export interface TrafficAccidentFields {
  severity: 'materiel' | 'leger' | 'grave' | 'mortel';
  vehicleTypes: Array<{
    type: 'voiture' | 'moto' | 'camion' | 'bus' | 'taxi' | 'velo' | 'pieton' | 'autre';
    count: number;
    damage: 'leger' | 'moyen' | 'grave' | 'epave';
  }>;
  
  // Victimes détaillées
  casualties: {
    hasVictims: boolean;
    victimCount: number;
    deaths: number;
    serious: number; // Blessés graves
    light: number;   // Blessés légers
    trapped: number; // Personnes bloquées
  };
  
  // Localisation précise
  roadInfo: {
    roadName: string;
    roadType: 'autoroute' | 'nationale' | 'regionale' | 'urbaine' | 'piste';
    direction?: string;
    nearestLandmark: string;
    kmPoint?: number;
  };
  
  // Impact circulation
  trafficImpact: {
    roadBlocked: boolean;
    lanesBlocked: number;
    trafficDiverted: boolean;
    estimatedDelay: number; // minutes
    alternativeRoute?: string;
  };
  
  // Conditions
  conditions: {
    weather: 'beau' | 'pluie' | 'brouillard' | 'orage';
    roadSurface: 'seche' | 'mouille' | 'boueuse' | 'glissante';
    visibility: 'bonne' | 'reduite' | 'tres_mauvaise';
    timeOfDay: 'jour' | 'nuit' | 'crepuscule';
  };
  
  // Services d'urgence
  emergencyResponse: {
    policeNeeded: boolean;
    ambulanceNeeded: boolean;
    fireServiceNeeded: boolean;
    towTruckNeeded: boolean;
    serviceCalled: boolean;
    eta?: number; // minutes
  };
  
  // Cause suspectée
  suspectedCause?: 'vitesse' | 'alcool' | 'fatigue' | 'telephone' | 'depassement' | 'meteo' | 'vehicule' | 'route' | 'autre';
}

// Vol/Cambriolage unifié
export interface TheftFields {
  theftType: 'vol_main_armee' | 'pickpocket' | 'vol_vehicule' | 'cambriolage_domicile' | 'cambriolage_commerce' | 'vol_portable' | 'vol_moto' | 'autre';
  
  // Lieu et circonstances
  location: {
    locationType: 'domicile' | 'commerce' | 'rue' | 'transport' | 'marche' | 'ecole' | 'bureau' | 'autre';
    securityLevel: 'aucune' | 'faible' | 'moyenne' | 'forte';
    crowdLevel: 'desert' | 'peu_de_monde' | 'normal' | 'foule';
  };
  
  // Armes et violence
  weapon: {
    weaponUsed: boolean;
    weaponType?: 'arme_feu' | 'couteau' | 'machette' | 'baton' | 'autre';
    violence: boolean;
    injuries: boolean;
    injuryDescription?: string;
  };
  
  // Suspects
  suspects: {
    count: number;
    fled: boolean;
    vehicle?: string;
    direction?: string;
    descriptions: Array<{
      age?: string;
      gender?: 'homme' | 'femme';
      height?: string;
      clothing?: string;
      distinguishingMarks?: string;
    }>;
  };
  
  // Biens volés
  stolenItems: Array<{
    category: 'argent' | 'telephone' | 'vehicule' | 'bijoux' | 'electronique' | 'documents' | 'autre';
    description: string;
    value?: number;
    serialNumber?: string;
  }>;
  
  // Témoins
  witnesses: {
    hasWitnesses: boolean;
    witnessCount: number;
    contactInfo?: string;
  };
}

// Disparition enrichie
export interface DisappearanceFields {
  // Type de recherche
  searchType?: 'missing' | 'wanted' | 'runaway' | 'lost_child' | 'alzheimer';

  // Message d'urgence personnalisé
  urgencyMessage?: string;

  // Informations personnelles
  person: {
    fullName: string;
    age: number;
    gender: 'homme' | 'femme' | 'enfant';
    nationality: string;
    idNumber?: string;
    profession?: string;
    languages?: string[]; // Langues parlées
  };

  // Description physique détaillée
  physicalDescription: {
    height: string;
    weight?: string;
    build: 'mince' | 'moyen' | 'corpulent';
    hairColor: string;
    eyeColor: string;
    skinColor: string;
    distinguishingMarks: string;
    disabilities?: string;
  };

  // Vêtements et objets
  lastClothing: {
    description: string;
    colors: string[];
    jewelry?: string;
    bag?: string;
    shoes?: string;
  };

  // Circonstances de la disparition
  circumstances: {
    lastSeenDate: string;
    lastSeenTime: string;
    lastSeenLocation: string;
    lastSeenWith?: string;
    activityBeforeDisappearance: string;
    mood: 'normal' | 'inquiet' | 'deprime' | 'agite' | 'autre';
    hadMoney: boolean;
    hadPhone: boolean;
    phoneNumber?: string;
  };

  // Contexte médical/social
  context: {
    medicalConditions?: string;
    medications?: string;
    mentalHealth?: string;
    familyProblems: boolean;
    workProblems: boolean;
    threatReceived: boolean;
    suicidalThoughts: boolean;
  };

  // Recherches déjà effectuées
  searchEfforts: {
    familySearched: boolean;
    friendsContacted: boolean;
    workplaceChecked: boolean;
    hospitalChecked: boolean;
    policeReported: boolean;
    reportNumber?: string;
  };

  // Contacts importants (proches de la personne disparue)
  contacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    lastContact?: string;
  }>;

  // Numéros à contacter pour signalement (famille/autorités)
  contactNumbers: Array<{
    phone: string;
    owner: string; // Nom du propriétaire du numéro
  }>;
}

// Incendies détaillés
export interface FireFields {
  fireType: 'domestique' | 'commercial' | 'industriel' | 'vehicule' | 'foret' | 'brousse' | 'autre';
  
  // Ampleur et propagation
  extent: {
    size: 'petit' | 'moyen' | 'grand' | 'majeur';
    spreadRisk: 'faible' | 'moyen' | 'eleve' | 'critique';
    structuresAtRisk: number;
    peopleEvacuated: number;
    evacuationNeeded: boolean;
  };
  
  // Victimes et sauvetage
  casualties: {
    hasVictims: boolean;
    trapped: number;
    injured: number;
    missing: number;
    evacuated: number;
  };
  
  // Origine et cause
  origin: {
    suspectedCause?: 'electrique' | 'gaz' | 'cigarette' | 'cuisson' | 'criminelle' | 'naturelle' | 'inconnue';
    startLocation: string;
    timeStarted?: string;
    witnessedStart: boolean;
  };
  
  // Conditions environnementales
  conditions: {
    weather: 'sec' | 'humide' | 'venteux' | 'pluvieux';
    windDirection?: string;
    temperature?: number;
    humidity?: 'faible' | 'moyenne' | 'forte';
  };
  
  // Services et intervention
  response: {
    fireServiceCalled: boolean;
    eta?: number;
    waterAvailable: boolean;
    accessDifficulties: boolean;
    equipmentNeeded: string[];
  };
  
  // Impact et dommages
  impact: {
    buildingsAffected: number;
    estimatedLoss?: number;
    infrastructureDamage: boolean;
    environmentalImpact: boolean;
  };
}

// Inondations
export interface FloodFields {
  floodType: 'riviere' | 'urbaine' | 'eclair' | 'barrage' | 'autre';
  
  // Niveau et étendue
  waterLevel: {
    currentLevel: 'cheville' | 'genou' | 'taille' | 'poitrine' | 'au_dessus_tete';
    rising: boolean;
    rateOfRise: 'lent' | 'moyen' | 'rapide';
    peakExpected?: string;
  };
  
  // Zone affectée
  affectedArea: {
    neighborhoods: string[];
    estimatedPeople: number;
    vulnerableBuildings: number;
    criticalInfrastructure: string[];
  };
  
  // Évacuation
  evacuation: {
    needed: boolean;
    peopleEvacuated: number;
    peopleRefusing: number;
    evacuationRoute: string;
    shelterLocation?: string;
    transportNeeded: boolean;
  };
  
  // Services et aide
  assistance: {
    rescueBoatsNeeded: boolean;
    pumpsNeeded: boolean;
    sanitationRisk: boolean;
    medicalAidNeeded: boolean;
    foodWaterNeeded: boolean;
  };
}

// Infrastructure et pannes
export interface InfrastructureFields {
  infrastructureType: 'electricite' | 'eau' | 'telecoms' | 'route' | 'pont' | 'autre';
  
  // Étendue de la panne
  outage: {
    affectedArea: string;
    estimatedPeople: number;
    businessesAffected: number;
    criticalServicesAffected: string[];
    startTime: string;
    estimatedDuration?: string;
  };
  
  // Cause et impact
  cause: {
    suspectedCause?: 'technique' | 'meteo' | 'accident' | 'maintenance' | 'surcharge' | 'vandalisme';
    damageLevel: 'leger' | 'moyen' | 'grave';
    repairComplexity: 'simple' | 'moyen' | 'complexe';
  };
  
  // Services de secours
  response: {
    providerNotified: boolean;
    estimatedRepairTime?: number;
    temporarySolution: boolean;
    priorityRepair: boolean;
  };
}

// ============ FONCTIONS UTILITAIRES ============

export function getFieldsForCategory(categoryCode: string): any {
  const fieldsMap: Record<string, () => any> = {
    'MEDC': () => createMedicalEmergencyFields(),
    'MED': () => createMedicalEmergencyFields(),
    'ACCG': () => createTrafficAccidentFields(),
    'ACCL': () => createTrafficAccidentFields(),
    'VOL': () => createTheftFields(),
    'DISC': () => createDisappearanceFields(),
    'DIS': () => createDisappearanceFields(),
    'FIRV': () => createFireFields(),
    'FIR': () => createFireFields(),
    'FORF': () => createFireFields(),
    'INON': () => createFloodFields(),
    'GLIS': () => createFloodFields(),
    'ELEC': () => createInfrastructureFields('electricite'),
    'EAU': () => createInfrastructureFields('eau'),
    'TEL': () => createInfrastructureFields('telecoms'),
    'ROU': () => createInfrastructureFields('route'),
  };
  
  return fieldsMap[categoryCode]?.() || null;
}

function createMedicalEmergencyFields(): Partial<MedicalEmergencyFields> {
  return {
    victimCount: 1,
    victimAges: [{
      ageRange: 'adulte',
      condition: 'conscient'
    }],
    symptoms: [],
    consciousness: 'conscient',
    breathing: 'normale',
    bleeding: false,
    emergencyServicesCalled: false,
    ambulanceNeeded: true
  };
}

function createTrafficAccidentFields(): Partial<TrafficAccidentFields> {
  return {
    severity: 'materiel',
    vehicleTypes: [{
      type: 'voiture',
      count: 1,
      damage: 'leger'
    }],
    casualties: {
      hasVictims: false,
      victimCount: 0,
      deaths: 0,
      serious: 0,
      light: 0,
      trapped: 0
    },
    roadInfo: {
      roadName: '',
      roadType: 'urbaine',
      nearestLandmark: ''
    },
    trafficImpact: {
      roadBlocked: false,
      lanesBlocked: 0,
      trafficDiverted: false,
      estimatedDelay: 0
    },
    conditions: {
      weather: 'beau',
      roadSurface: 'seche',
      visibility: 'bonne',
      timeOfDay: 'jour'
    },
    emergencyResponse: {
      policeNeeded: true,
      ambulanceNeeded: false,
      fireServiceNeeded: false,
      towTruckNeeded: false,
      serviceCalled: false
    }
  };
}

function createTheftFields(): Partial<TheftFields> {
  return {
    theftType: 'vol_main_armee',
    location: {
      locationType: 'rue',
      securityLevel: 'aucune',
      crowdLevel: 'normal'
    },
    weapon: {
      weaponUsed: false,
      violence: false,
      injuries: false
    },
    suspects: {
      count: 1,
      fled: true,
      descriptions: [{}]
    },
    stolenItems: [],
    witnesses: {
      hasWitnesses: false,
      witnessCount: 0
    }
  };
}

function createDisappearanceFields(): Partial<DisappearanceFields> {
  return {
    searchType: 'missing',
    urgencyMessage: '',
    person: {
      fullName: '',
      age: 0,
      gender: 'homme',
      nationality: 'Camerounaise',
      languages: []
    },
    physicalDescription: {
      height: '',
      build: 'moyen',
      hairColor: '',
      eyeColor: '',
      skinColor: '',
      distinguishingMarks: ''
    },
    lastClothing: {
      description: '',
      colors: []
    },
    circumstances: {
      lastSeenDate: '',
      lastSeenTime: '',
      lastSeenLocation: '',
      activityBeforeDisappearance: '',
      mood: 'normal',
      hadMoney: false,
      hadPhone: false
    },
    context: {
      familyProblems: false,
      workProblems: false,
      threatReceived: false,
      suicidalThoughts: false
    },
    searchEfforts: {
      familySearched: false,
      friendsContacted: false,
      workplaceChecked: false,
      hospitalChecked: false,
      policeReported: false
    },
    contacts: [],
    contactNumbers: []
  };
}

function createFireFields(): Partial<FireFields> {
  return {
    fireType: 'domestique',
    extent: {
      size: 'petit',
      spreadRisk: 'faible',
      structuresAtRisk: 0,
      peopleEvacuated: 0,
      evacuationNeeded: false
    },
    casualties: {
      hasVictims: false,
      trapped: 0,
      injured: 0,
      missing: 0,
      evacuated: 0
    },
    origin: {
      startLocation: '',
      witnessedStart: false
    },
    conditions: {
      weather: 'sec'
    },
    response: {
      fireServiceCalled: false,
      waterAvailable: true,
      accessDifficulties: false,
      equipmentNeeded: []
    },
    impact: {
      buildingsAffected: 1,
      infrastructureDamage: false,
      environmentalImpact: false
    }
  };
}

function createFloodFields(): Partial<FloodFields> {
  return {
    floodType: 'urbaine',
    waterLevel: {
      currentLevel: 'cheville',
      rising: false,
      rateOfRise: 'lent'
    },
    affectedArea: {
      neighborhoods: [],
      estimatedPeople: 0,
      vulnerableBuildings: 0,
      criticalInfrastructure: []
    },
    evacuation: {
      needed: false,
      peopleEvacuated: 0,
      peopleRefusing: 0,
      evacuationRoute: '',
      transportNeeded: false
    },
    assistance: {
      rescueBoatsNeeded: false,
      pumpsNeeded: false,
      sanitationRisk: false,
      medicalAidNeeded: false,
      foodWaterNeeded: false
    }
  };
}

function createInfrastructureFields(type: string): Partial<InfrastructureFields> {
  return {
    infrastructureType: type as any,
    outage: {
      affectedArea: '',
      estimatedPeople: 0,
      businessesAffected: 0,
      criticalServicesAffected: [],
      startTime: new Date().toISOString()
    },
    cause: {
      damageLevel: 'leger',
      repairComplexity: 'simple'
    },
    response: {
      providerNotified: false,
      temporarySolution: false,
      priorityRepair: false
    }
  };
}

export default {
  getFieldsForCategory,
  createMedicalEmergencyFields,
  createTrafficAccidentFields,
  createTheftFields,
  createDisappearanceFields,
  createFireFields,
  createFloodFields,
  createInfrastructureFields
};
