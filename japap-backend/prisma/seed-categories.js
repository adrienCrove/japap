/**
 * Script de seed pour importer les 31 catégories d'alertes dans CategoryAlert
 * Basé sur enhanced-categories.ts de japap-admin
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ CATÉGORIES COMPLÈTES ============

// 🔴 URGENCES VITALES (Intervention immédiate < 5 min)
const CRITICAL_CATEGORIES = [
  {
    code: 'MEDC',
    name: 'Urgence médicale critique',
    description: 'Arrêt cardiaque, accident grave avec blessés, urgence vitale',
    icon: '🚑',
    color: '#dc2626',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    expirationHours: 10,
    emergencyServices: ['SAMU', 'Hôpital_Central', 'Pompiers'],
    routingMatrix: ['SAMU', 'Hôpital_Central', 'Pompiers', 'Admin_Santé'],
    keywords: ['urgence', 'médical', 'critique', 'cœur', 'cardiaque', 'blessé', 'grave', 'accident', 'mort', 'mourir'],
    order: 1
  },
  {
    code: 'FIRV',
    name: 'Incendie avec victimes',
    description: 'Incendie en cours avec personnes en danger',
    icon: '🔥',
    color: '#dc2626',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    expirationHours: 12,
    emergencyServices: ['Pompiers', 'SAMU', 'Police'],
    routingMatrix: ['Pompiers', 'SAMU', 'Police', 'Protection_Civile'],
    keywords: ['incendie', 'feu', 'flamme', 'brûle', 'victime', 'piégé', 'coincé', 'fumée', 'aide'],
    order: 2
  },
  {
    code: 'ACCG',
    name: 'Accident grave de circulation',
    description: 'Accident avec victimes ou blocage axe majeur',
    icon: '🚗',
    color: '#dc2626',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    expirationHours: 8,
    emergencyServices: ['Police', 'SAMU', 'Gendarmerie'],
    routingMatrix: ['Police', 'SAMU', 'Gendarmerie', 'MINTP'],
    keywords: ['accident', 'grave', 'collision', 'choc', 'renversé', 'percuté', 'crash', 'blessé', 'mort', 'ambulance'],
    order: 3
  },
  {
    code: 'ASGC',
    name: 'Agression en cours',
    description: 'Agression, vol à main armée en cours',
    icon: '🚨',
    color: '#dc2626',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    expirationHours: 6,
    emergencyServices: ['Police', 'Gendarmerie'],
    routingMatrix: ['Police', 'Gendarmerie', 'BIR'],
    keywords: ['agression', 'attaque', 'braquage', 'arme', 'couteau', 'pistolet', 'vol', 'main armée', 'danger', 'aide'],
    order: 4
  },
  {
    code: 'DISC',
    name: 'Disparition critique',
    description: 'Enlèvement présumé, disparition d\'enfant',
    icon: '👶',
    color: '#dc2626',
    priority: 'critical',
    responseTime: 5,
    defaultSeverity: 'critical',
    expirationHours: null, // Pas d'expiration auto - reste prioritaire jusqu'à résolution manuelle
    emergencyServices: ['Police', 'Gendarmerie', 'Protection_Civile'],
    routingMatrix: ['Police', 'Gendarmerie', 'Protection_Civile', 'Préfecture'],
    keywords: ['enlèvement', 'kidnapping', 'disparu', 'enfant', 'bébé', 'rapt', 'perdu', 'urgent'],
    order: 5
  }
];

// 🟠 URGENCES SÉCURITAIRES (Intervention < 15 min)
const HIGH_PRIORITY_CATEGORIES = [
  {
    code: 'VOL',
    name: 'Vol/Cambriolage',
    description: 'Vol, cambriolage, larcin',
    icon: '🥷',
    color: '#ea580c',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    expirationHours: 48,
    emergencyServices: ['Police', 'Gendarmerie'],
    routingMatrix: ['Police', 'Gendarmerie'],
    keywords: ['vol', 'volé', 'cambriolage', 'larcin', 'voleur', 'cambrioler', 'dépouillé', 'pickpocket'],
    order: 6
  },
  {
    code: 'ASS',
    name: 'Agression/Violence',
    description: 'Agression physique, violence domestique',
    icon: '👊',
    color: '#ea580c',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    expirationHours: 24,
    emergencyServices: ['Police', 'Gendarmerie', 'SAMU'],
    routingMatrix: ['Police', 'Gendarmerie', 'SAMU'],
    keywords: ['agression', 'violence', 'bagarre', 'frappé', 'battu', 'domestique', 'conjoint'],
    order: 7
  },
  {
    code: 'DIS',
    name: 'Disparition standard',
    description: 'Personne disparue sans enlèvement présumé',
    icon: '👤',
    color: '#ea580c',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    expirationHours: null, // Pas d'expiration auto - reste prioritaire jusqu'à résolution manuelle
    emergencyServices: ['Police', 'Gendarmerie'],
    routingMatrix: ['Police', 'Gendarmerie', 'Protection_Civile'],
    keywords: ['disparu', 'disparue', 'perdu', 'introuvable', 'recherche', 'personne'],
    order: 8
  },
  {
    code: 'MANV',
    name: 'Manifestation violente',
    description: 'Émeute, troubles à l\'ordre public',
    icon: '🚧', // Changé de ⚡ à 🚧 pour éviter duplication avec ELEC
    color: '#ea580c',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    expirationHours: 12,
    emergencyServices: ['Forces_Ordre', 'Préfecture'],
    routingMatrix: ['Forces_Ordre', 'Préfecture', 'Admin_Territoriale'],
    keywords: ['manifestation', 'émeute', 'violence', 'trouble', 'bagarre', 'chaos'],
    order: 9
  },
  {
    code: 'MED',
    name: 'Urgence médicale standard',
    description: 'Urgence médicale sans danger immédiat',
    icon: '🏥',
    color: '#ea580c',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    expirationHours: 12,
    emergencyServices: ['SAMU', 'Hôpital'],
    routingMatrix: ['SAMU', 'Hôpital', 'Centre_Santé'],
    keywords: ['urgence', 'médical', 'malaise', 'douleur', 'malade', 'hôpital', 'santé'],
    order: 10
  },
  {
    code: 'EPI',
    name: 'Épidémie/Maladie contagieuse',
    description: 'Maladie contagieuse, épidémie suspectée',
    icon: '🦠',
    color: '#ea580c',
    priority: 'high',
    responseTime: 15,
    defaultSeverity: 'high',
    expirationHours: 72,
    emergencyServices: ['MINSANTE', 'OMS', 'Préfecture'],
    routingMatrix: ['MINSANTE', 'OMS', 'Préfecture', 'CDC'],
    keywords: ['épidémie', 'contagieux', 'maladie', 'virus', 'contamination', 'choléra', 'fièvre'],
    order: 11
  }
];

// 🟡 ALERTES COMMUNAUTAIRES (Intervention < 30 min)
const MEDIUM_PRIORITY_CATEGORIES = [
  {
    code: 'INON',
    name: 'Inondation',
    description: 'Inondation, débordement cours d\'eau',
    icon: '🌊',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 36,
    emergencyServices: ['Protection_Civile', 'Mairie', 'Préfecture'],
    routingMatrix: ['Protection_Civile', 'Mairie', 'Préfecture', 'MINEPDED'],
    keywords: ['inondation', 'inondé', 'eau', 'débordement', 'crue', 'rivière', 'pluie'],
    order: 12
  },
  {
    code: 'GLIS',
    name: 'Glissement de terrain',
    description: 'Éboulement, glissement de terrain',
    icon: '⛰️',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 48,
    emergencyServices: ['Protection_Civile', 'Génie_Civil', 'Préfecture'],
    routingMatrix: ['Protection_Civile', 'Génie_Civil', 'Préfecture'],
    keywords: ['glissement', 'éboulement', 'terrain', 'effondrement', 'montagne', 'colline'],
    order: 13
  },
  {
    code: 'FIR',
    name: 'Incendie domestique/commercial',
    description: 'Incendie sans victimes connues',
    icon: '🏠', // Changé de 🔥 à 🏠 pour éviter duplication avec FIRV
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 24,
    emergencyServices: ['Pompiers', 'Police'],
    routingMatrix: ['Pompiers', 'Police', 'Mairie'],
    keywords: ['incendie', 'feu', 'brûle', 'flamme', 'fumée', 'maison', 'commerce'],
    order: 14
  },
  {
    code: 'FORF',
    name: 'Incendie de forêt',
    description: 'Feu de brousse, incendie forestier',
    icon: '🌲',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 48,
    emergencyServices: ['Pompiers', 'MINFOF', 'Protection_Civile'],
    routingMatrix: ['Pompiers', 'MINFOF', 'Protection_Civile'],
    keywords: ['feu', 'forêt', 'brousse', 'incendie', 'arbre', 'végétation'],
    order: 15
  },
  {
    code: 'ACCL',
    name: 'Accident de circulation léger',
    description: 'Accident matériel sans blessés',
    icon: '🚙',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 12,
    emergencyServices: ['Police', 'Gendarmerie'],
    routingMatrix: ['Police', 'Gendarmerie'],
    keywords: ['accident', 'léger', 'accrochage', 'collision', 'voiture', 'moto', 'matériel'],
    order: 16
  },
  {
    code: 'JAM',
    name: 'Embouteillage exceptionnel',
    description: 'Bouchon majeur, circulation bloquée',
    icon: '🚦',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 8,
    emergencyServices: ['Police', 'Circulation'],
    routingMatrix: ['Police', 'Circulation', 'MINTP'],
    keywords: ['embouteillage', 'bouchon', 'circulation', 'bloqué', 'trafic', 'route'],
    order: 17
  },
  {
    code: 'ELEC',
    name: 'Panne électrique',
    description: 'Coupure électricité, panne transformateur',
    icon: '⚡',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 24,
    emergencyServices: ['ENEO', 'Mairie'],
    routingMatrix: ['ENEO', 'Mairie', 'MINEE'],
    keywords: ['électricité', 'panne', 'coupure', 'courant', 'eneo', 'transformateur', 'lumière'],
    order: 18
  },
  {
    code: 'EAU',
    name: 'Panne d\'eau',
    description: 'Coupure eau, fuite majeure',
    icon: '💧',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 24,
    emergencyServices: ['CAMWATER', 'Mairie'],
    routingMatrix: ['CAMWATER', 'Mairie', 'MINEE'],
    keywords: ['eau', 'panne', 'coupure', 'fuite', 'camwater', 'robinet'],
    order: 19
  },
  {
    code: 'ANI',
    name: 'Animal sauvage en zone urbaine',
    description: 'Animal dangereux, faune sauvage',
    icon: '🦒',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 24,
    emergencyServices: ['MINFOF', 'Police', 'Vétérinaires'],
    routingMatrix: ['MINFOF', 'Police', 'Vétérinaires'],
    keywords: ['animal', 'sauvage', 'dangereux', 'bête', 'serpent', 'singe', 'chien'],
    order: 20
  },
  {
    code: 'ROU',
    name: 'Route/Pont endommagé',
    description: 'Infrastructure routière dégradée',
    icon: '🛣️',
    color: '#d97706',
    priority: 'medium',
    responseTime: 30,
    defaultSeverity: 'medium',
    expirationHours: 72,
    emergencyServices: ['MINTP', 'Mairie', 'Police'],
    routingMatrix: ['MINTP', 'Mairie', 'Police'],
    keywords: ['route', 'pont', 'endommagé', 'cassé', 'trou', 'nid de poule', 'infrastructure'],
    order: 21
  }
];

// 🟢 INFORMATIONS PUBLIQUES (Traitement différé)
const LOW_PRIORITY_CATEGORIES = [
  {
    code: 'MANP',
    name: 'Manifestation pacifique',
    description: 'Rassemblement pacifique, marche',
    icon: '✊',
    color: '#16a34a',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    expirationHours: 24,
    emergencyServices: ['Police', 'Préfecture'],
    routingMatrix: ['Police', 'Préfecture', 'Admin_Territoriale'],
    keywords: ['manifestation', 'pacifique', 'marche', 'rassemblement', 'calme'],
    order: 22
  },
  {
    code: 'ENV',
    name: 'Incident environnemental',
    description: 'Pollution, nuisances environnementales',
    icon: '🌱',
    color: '#16a34a',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    expirationHours: 72,
    emergencyServices: ['MINEPDED', 'Mairie'],
    routingMatrix: ['MINEPDED', 'Mairie', 'Police'],
    keywords: ['environnement', 'pollution', 'déchet', 'ordure', 'nuisance'],
    order: 23
  },
  {
    code: 'TEL',
    name: 'Panne télécommunications',
    description: 'Panne réseau mobile, internet',
    icon: '📶',
    color: '#16a34a',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    expirationHours: 24,
    emergencyServices: ['ART', 'Opérateurs'],
    routingMatrix: ['ART', 'Opérateurs', 'MINPOSTEL'],
    keywords: ['téléphone', 'réseau', 'internet', 'panne', 'mtn', 'orange', 'camtel'],
    order: 24
  },
  {
    code: 'COM',
    name: 'Événement communautaire',
    description: 'Rassemblement, cérémonie, événement',
    icon: '🎉',
    color: '#16a34a',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    expirationHours: 48,
    emergencyServices: ['Mairie', 'Chefferie'],
    routingMatrix: ['Mairie', 'Chefferie', 'Admin_Territoriale'],
    keywords: ['événement', 'cérémonie', 'fête', 'communauté', 'rassemblement'],
    order: 25
  },
  {
    code: 'SUS',
    name: 'Événement suspect',
    description: 'Activité suspecte, comportement anormal',
    icon: '🔍',
    color: '#16a34a',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    expirationHours: 48,
    emergencyServices: ['Police'],
    routingMatrix: ['Police', 'Gendarmerie'],
    keywords: ['suspect', 'bizarre', 'étrange', 'anormal', 'louche'],
    order: 26
  },
  {
    code: 'AUT',
    name: 'Autre urgence',
    description: 'Autre type d\'incident non classé',
    icon: '❓',
    color: '#16a34a',
    priority: 'low',
    responseTime: 60,
    defaultSeverity: 'low',
    expirationHours: 24,
    emergencyServices: ['Police', 'Mairie'],
    routingMatrix: ['Police', 'Mairie', 'Préfecture'],
    keywords: ['autre', 'alerte', 'urgent', 'attention', 'problème', 'aide'],
    order: 27
  }
];

const ALL_CATEGORIES = [
  ...CRITICAL_CATEGORIES,
  ...HIGH_PRIORITY_CATEGORIES,
  ...MEDIUM_PRIORITY_CATEGORIES,
  ...LOW_PRIORITY_CATEGORIES
];

async function seedCategories() {
  console.log('🌱 Starting CategoryAlert seeding...\n');

  let created = 0;
  let updated = 0;

  for (const category of ALL_CATEGORIES) {
    try {
      const existing = await prisma.categoryAlert.findUnique({
        where: { code: category.code }
      });

      if (existing) {
        await prisma.categoryAlert.update({
          where: { code: category.code },
          data: category
        });
        updated++;
        console.log(`✅ Updated: ${category.code} - ${category.name}`);
      } else {
        await prisma.categoryAlert.create({
          data: category
        });
        created++;
        console.log(`✨ Created: ${category.code} - ${category.name}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${category.code}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created} categories`);
  console.log(`   Updated: ${updated} categories`);
  console.log(`   Total: ${ALL_CATEGORIES.length} categories`);
  console.log('\n✅ CategoryAlert seeding completed!');
}

async function main() {
  try {
    await seedCategories();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
