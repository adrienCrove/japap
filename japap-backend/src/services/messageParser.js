/**
 * Service pour parser les messages Telegram et détecter les alertes
 * Utilise maintenant la DB (CategoryAlert) pour les keywords au lieu d'être hardcodé
 */

const prisma = require('../config/prismaClient');

// Cache pour les catégories (rechargé toutes les heures)
let cachedCategories = null;
let lastCacheUpdate = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

const SEVERITY_KEYWORDS = {
  critical: ['urgent', 'grave', 'critique', 'mortel', 'décès', 'mort'],
  high: ['important', 'sérieux', 'dangereux', 'blessé'],
  medium: ['moyen', 'attention'],
  low: ['léger', 'mineur', 'petit']
};

/**
 * Récupérer les catégories depuis la DB avec cache
 */
async function getCategories() {
  const now = Date.now();

  // Utiliser le cache si disponible et récent
  if (cachedCategories && lastCacheUpdate && (now - lastCacheUpdate < CACHE_DURATION_MS)) {
    return cachedCategories;
  }

  // Sinon, fetch depuis la DB
  try {
    const categories = await prisma.categoryAlert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        keywords: true,
        defaultSeverity: true,
        priority: true
      }
    });

    cachedCategories = categories;
    lastCacheUpdate = now;

    return categories;
  } catch (error) {
    console.error('Error fetching categories from DB:', error);
    // Si erreur DB, retourner cache même périmé ou array vide
    return cachedCategories || [];
  }
}

/**
 * Parse un message Telegram pour détecter une alerte
 * @param {string} messageText - Texte du message
 * @returns {Object} - { isAlert, categoryCode, categoryId, categoryName, severity, location, description }
 */
exports.parseForAlert = async (messageText) => {
  if (!messageText || messageText.length < 10) {
    return { isAlert: false };
  }

  const text = messageText.toLowerCase();
  const categories = await getCategories();

  if (categories.length === 0) {
    console.warn('No categories available for message parsing');
    return { isAlert: false };
  }

  // 1. Détecter la catégorie en matchant les keywords
  let bestMatch = null;
  let bestScore = 0;
  let matchedKeywords = [];

  for (const category of categories) {
    const keywords = Array.isArray(category.keywords) ? category.keywords : [];
    const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
    const score = matches.length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
      matchedKeywords = matches;
    }
  }

  // Si aucune catégorie détectée, ce n'est probablement pas une alerte
  if (!bestMatch || bestScore === 0) {
    return { isAlert: false };
  }

  // 2. Détecter la gravité (basée sur keywords + catégorie par défaut)
  let severity = bestMatch.defaultSeverity;
  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      severity = level;
      break;
    }
  }

  // 3. Extraire la localisation (basique - regex pour adresses camerounaises)
  let location = null;

  // Patterns pour détecter localisation
  const locationPatterns = [
    /à\s+([A-Za-zÀ-ÿ\s]+)(?:\,|\.|\s|$)/i,  // "à Douala", "à Yaoundé"
    /quartier\s+([A-Za-zÀ-ÿ\s]+)(?:\,|\.|\s|$)/i,
    /route\s+de\s+([A-Za-zÀ-ÿ\s]+)(?:\,|\.|\s|$)/i,
    /carrefour\s+([A-Za-zÀ-ÿ\s]+)(?:\,|\.|\s|$)/i,
    /près\s+de\s+([A-Za-zÀ-ÿ\s]+)(?:\,|\.|\s|$)/i
  ];

  for (const pattern of locationPatterns) {
    const match = messageText.match(pattern);
    if (match && match[1]) {
      location = match[1].trim();
      break;
    }
  }

  // 4. Si pas de localisation, chercher des noms de villes connues
  const cameroonCities = ['yaoundé', 'douala', 'bafoussam', 'garoua', 'maroua', 'bamenda', 'ngaoundéré', 'bertoua', 'ebolowa', 'kribi', 'limbe', 'buea'];
  if (!location) {
    for (const city of cameroonCities) {
      if (text.includes(city)) {
        location = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
  }

  return {
    isAlert: true,
    categoryId: bestMatch.id,
    categoryCode: bestMatch.code,
    categoryName: bestMatch.name,
    category: bestMatch.code, // Pour compatibilité avec ancien code
    severity: severity,
    location: location || 'Non spécifiée',
    description: messageText.substring(0, 500),  // Limiter à 500 caractères
    confidence: bestScore > 2 ? 'high' : bestScore > 1 ? 'medium' : 'low',
    matchedKeywords: matchedKeywords,
    matchScore: bestScore
  };
};

/**
 * Extraire les mots-clés d'un message en utilisant la DB
 * @param {string} messageText
 * @returns {Array} - Liste de mots-clés trouvés
 */
exports.extractKeywords = async (messageText) => {
  const text = messageText.toLowerCase();
  const foundKeywords = [];
  const categories = await getCategories();

  for (const category of categories) {
    const keywords = Array.isArray(category.keywords) ? category.keywords : [];
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase()) && !foundKeywords.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }
  }

  return foundKeywords;
};

/**
 * Forcer le rechargement du cache des catégories
 */
exports.refreshCategoriesCache = async () => {
  lastCacheUpdate = null;
  return await getCategories();
};

/**
 * Obtenir toutes les catégories chargées (pour debug)
 */
exports.getLoadedCategories = () => {
  return cachedCategories;
};
