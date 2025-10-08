/**
 * Service pour parser les messages Telegram et détecter les alertes
 */

const ALERT_KEYWORDS = {
  accident: ['accident', 'collision', 'choc', 'renversé', 'percuté', 'crash'],
  incendie: ['incendie', 'feu', 'brûle', 'flamme', 'fumée'],
  vol: ['vol', 'cambriolage', 'volé', 'braquage', 'voleur', 'arnaque'],
  disparition: ['disparu', 'disparue', 'perdu', 'introuvable', 'recherche personne'],
  inondation: ['inondation', 'inondé', 'eau', 'débordement', 'crue'],
  autres: ['alerte', 'urgent', 'danger', 'attention', 'problème', 'aide']
};

const SEVERITY_KEYWORDS = {
  critical: ['urgent', 'grave', 'critique', 'mortel', 'décès', 'mort'],
  high: ['important', 'sérieux', 'dangereux', 'blessé'],
  medium: ['moyen', 'attention'],
  low: ['léger', 'mineur', 'petit']
};

/**
 * Parse un message Telegram pour détecter une alerte
 * @param {string} messageText - Texte du message
 * @returns {Object} - { isAlert, category, severity, location, description }
 */
exports.parseForAlert = (messageText) => {
  if (!messageText || messageText.length < 10) {
    return { isAlert: false };
  }

  const text = messageText.toLowerCase();

  // 1. Détecter la catégorie
  let category = null;
  let matchScore = 0;

  for (const [cat, keywords] of Object.entries(ALERT_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > matchScore) {
      matchScore = matches;
      category = cat;
    }
  }

  // Si aucune catégorie détectée, ce n'est probablement pas une alerte
  if (!category || matchScore === 0) {
    return { isAlert: false };
  }

  // 2. Détecter la gravité
  let severity = 'medium';
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
    category: category,
    severity: severity,
    location: location || 'Non spécifiée',
    description: messageText.substring(0, 500),  // Limiter à 500 caractères
    confidence: matchScore > 2 ? 'high' : matchScore > 1 ? 'medium' : 'low'
  };
};

/**
 * Extraire les mots-clés d'un message
 * @param {string} messageText
 * @returns {Array} - Liste de mots-clés
 */
exports.extractKeywords = (messageText) => {
  const text = messageText.toLowerCase();
  const foundKeywords = [];

  for (const keywords of Object.values(ALERT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword) && !foundKeywords.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }
  }

  return foundKeywords;
};
