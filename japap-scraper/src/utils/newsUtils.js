const { categoryMapping, relevanceKeywords, excludedCategories, blacklistKeywords } = require('../config/sources');

/**
 * Catégorise un article basé sur le titre et le contenu
 * @param {string} title - Titre de l'article
 * @param {string} content - Contenu de l'article
 * @param {Array} sourceCategories - Catégories de la source
 * @returns {Object} { categories: Array, primaryCategory: String }
 */
function categorizeArticle(title, content, sourceCategories = []) {
  const text = `${title} ${content}`.toLowerCase();
  const detectedCategories = new Set();

  // Ajouter les catégories de la source (filtrer les catégories valides)
  sourceCategories.forEach(cat => {
    const normalizedCat = cat.toLowerCase();
    if (categoryMapping.hasOwnProperty(normalizedCat)) {
      detectedCategories.add(normalizedCat);
    }
  });

  // Mapper les keywords aux 13 catégories
  for (const [category, keywords] of Object.entries(categoryMapping)) {
    const hasKeyword = keywords.some(keyword => text.includes(keyword.toLowerCase()));
    if (hasKeyword) {
      detectedCategories.add(category);
    }
  }

  const categories = Array.from(detectedCategories);

  // Déterminer la catégorie principale selon priorité
  // Priorité : Civique (urgence) > Économique
  const categoryPriority = [
    // Catégories civiques (haute priorité)
    'securite',
    'catastrophes',
    'transport',
    'justice',
    'sante',
    'meteo',

    // Catégories économiques (priorité normale)
    'energie',
    'travaux-publics',
    'economie',
    'education',
    'agriculture',
    'finance',
    'assurance',
    'mines'
  ];

  const primaryCategory = categoryPriority.find(cat => categories.includes(cat)) || categories[0] || 'sante';

  return {
    categories,
    primaryCategory
  };
}

/**
 * Calcule le score de pertinence d'un article (0.0 - 1.0)
 * @param {string} title - Titre de l'article
 * @param {string} content - Contenu de l'article
 * @param {Array} categories - Catégories détectées
 * @returns {number} Score entre 0.0 et 1.0
 */
function calculateRelevanceScore(title, content, categories) {
  let score = 0.5; // Score de base

  const text = `${title} ${content}`.toLowerCase();

  // +0.3 pour mots-clés haute priorité
  const hasHighKeywords = relevanceKeywords.high.some(kw => text.includes(kw.toLowerCase()));
  if (hasHighKeywords) {
    score += 0.3;
  }

  // +0.15 pour mots-clés moyenne priorité
  const hasMediumKeywords = relevanceKeywords.medium.some(kw => text.includes(kw.toLowerCase()));
  if (hasMediumKeywords) {
    score += 0.15;
  }

  // +0.1 si catégorie pertinente pour JAPAP
  const relevantCategories = ['sécurité', 'accident', 'santé', 'infrastructure'];
  if (categories.some(cat => relevantCategories.includes(cat))) {
    score += 0.1;
  }

  // +0.05 si article récent (titre contient date ou "aujourd'hui")
  if (text.includes('aujourd\'hui') || text.includes('ce jour')) {
    score += 0.05;
  }

  // Limiter entre 0 et 1
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Extrait l'image principale d'un contenu HTML
 * @param {string} htmlContent - Contenu HTML
 * @returns {string|null} URL de l'image
 */
function extractMainImage(htmlContent) {
  // Cette fonction est utilisée si l'image n'est pas dans les métadonnées RSS
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = htmlContent.match(imgRegex);
  return match ? match[1] : null;
}

/**
 * Génère un slug URL-friendly à partir d'un titre
 * @param {string} title - Titre de l'article
 * @returns {string} Slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD') // Normaliser les accents
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
    .substring(0, 100); // Limiter à 100 caractères
}

/**
 * Extrait les coordonnées géographiques d'un texte (si mentionnées)
 * @param {string} text - Texte à analyser
 * @returns {Object|null} { lat, lng } ou null
 */
function extractCoordinates(text) {
  // Pattern pour coordonnées: 3.8480°N, 11.5021°E ou (3.8480, 11.5021)
  const coordRegex = /(\d+\.\d+)[°\s]*[NS]?,?\s*(\d+\.\d+)[°\s]*[EW]?/i;
  const match = text.match(coordRegex);

  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2])
    };
  }

  return null;
}

/**
 * Extrait les villes camerounaises mentionnées dans le texte
 * @param {string} text - Texte à analyser
 * @returns {Array} Liste des villes détectées
 */
function extractCameroonCities(text) {
  const cities = [
    'Yaoundé', 'Douala', 'Garoua', 'Bafoussam', 'Bamenda', 'Maroua',
    'Ngaoundéré', 'Bertoua', 'Kribi', 'Limbé', 'Edéa', 'Kumba',
    'Buéa', 'Ebolowa', 'Nkongsamba', 'Loum', 'Foumban'
  ];

  const detectedCities = [];
  const lowerText = text.toLowerCase();

  for (const city of cities) {
    if (lowerText.includes(city.toLowerCase())) {
      detectedCities.push(city);
    }
  }

  return detectedCities;
}

/**
 * Détermine si un article est pertinent (non blacklisté)
 * Filtre les articles de sport, people, mode, etc.
 * @param {string} title - Titre de l'article
 * @param {string} content - Contenu de l'article
 * @param {Array} categories - Catégories détectées
 * @returns {boolean} True si article pertinent, False sinon
 */
function isArticleRelevant(title, content, categories = []) {
  const text = `${title} ${content}`.toLowerCase();

  // Rejeter si contient des mots blacklistés
  const hasBlacklistedKeywords = blacklistKeywords.some(kw =>
    text.includes(kw.toLowerCase())
  );

  if (hasBlacklistedKeywords) {
    return false;
  }

  // Rejeter si catégorie exclue
  const hasExcludedCategory = categories.some(cat =>
    excludedCategories.includes(cat.toLowerCase())
  );

  if (hasExcludedCategory) {
    return false;
  }

  return true;
}

/**
 * Détermine si un article est lié à une alerte potentielle
 * @param {string} title - Titre
 * @param {string} content - Contenu
 * @returns {boolean}
 */
function isAlertRelated(title, content) {
  const alertKeywords = [
    'accident', 'incendie', 'urgence', 'alerte', 'danger', 'décès',
    'blessé', 'collision', 'explosion', 'évacuation', 'fermeture',
    'perturbation', 'grève', 'manifestation', 'émeute'
  ];

  const text = `${title} ${content}`.toLowerCase();
  return alertKeywords.some(kw => text.includes(kw));
}

/**
 * Nettoie et valide une URL
 * @param {string} url - URL à valider
 * @returns {string|null} URL nettoyée ou null
 */
function cleanUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch (error) {
    return null;
  }
}

/**
 * Tronque le texte à une longueur donnée sans couper les mots
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string}
 */
function truncateText(text, maxLength = 300) {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

module.exports = {
  categorizeArticle,
  calculateRelevanceScore,
  extractMainImage,
  generateSlug,
  extractCoordinates,
  extractCameroonCities,
  isArticleRelevant,
  isAlertRelated,
  cleanUrl,
  truncateText
};
