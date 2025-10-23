/**
 * Configuration des sources d'actualités camerounaises
 * Basé sur kiosk_sources_ci_cm.yml - Sources CM uniquement
 */

module.exports = {
  sources: [
    // Sources camerounaises officielles
    {
      name: "Cameroon Tribune",
      url: "https://www.cameroon-tribune.cm/rss/",
      type: "rss",
      category: ["sécurité", "transport", "santé", "infrastructure"],
      location: { country: "CM", city: "Yaoundé" },
      credibility: 0.9,
      enabled: true
    },
    {
      name: "CRTV News",
      url: "https://www.crtv.cm/feed/",
      type: "rss",
      category: ["sécurité", "transport", "météo"],
      location: { country: "CM", city: "Yaoundé" },
      credibility: 0.9,
      enabled: true
    },
    {
      name: "Journal du Cameroun",
      url: "https://www.journalducameroun.com/feed/",
      type: "rss",
      category: ["sécurité", "transport", "justice"],
      location: { country: "CM", city: "Yaoundé" },
      credibility: 0.8,
      enabled: true
    },

    // Sources pure players
    {
      name: "ActuCameroun",
      url: "https://actucameroun.com/feed/",
      type: "rss",
      category: ["sécurité", "transport"],
      location: { country: "CM", city: "Douala" },
      credibility: 0.6,
      enabled: true
    },
    {
      name: "Cameroon-Info.Net",
      url: "https://www.cameroon-info.net/feed/",
      type: "rss",
      category: ["sécurité", "transport", "justice"],
      location: { country: "CM", city: "Douala" },
      credibility: 0.7,
      enabled: true
    },
    {
      name: "237online",
      url: "https://www.237online.com/feed/",
      type: "rss",
      category: ["sécurité", "transport"],
      location: { country: "CM", city: "Douala" },
      credibility: 0.5,
      enabled: true
    },
    {
      name:"investir au cameroun",
      url: "https://www.investiraucameroun.com/feed/",
      type: "rss",
      category: ["sécurité", "transport"],
      location: { country: "CM", city: "Douala" },
      credibility: 0.5,
      enabled: true
    },

    // Journaux privés
    {
      name: "Le Jour",
      url: "https://www.journal-lejour.com/feed/",
      type: "rss",
      category: ["sécurité", "justice"],
      location: { country: "CM", city: "Yaoundé" },
      credibility: 0.6,
      enabled: true
    },
    {
      name: "Le Messager",
      url: "https://lemessager.net/feed/",
      type: "rss",
      category: ["sécurité", "justice"],
      location: { country: "CM", city: "Douala" },
      credibility: 0.6,
      enabled: true
    },
    {
      name: "Mutations",
      url: "https://www.mutations.cm/feed/",
      type: "rss",
      category: ["sécurité", "justice"],
      location: { country: "CM", city: "Yaoundé" },
      credibility: 0.6,
      enabled: true
    },

    // Sources anglophones
    {
      name: "The Guardian Post",
      url: "https://guardianpostcameroon.com/feed/",
      type: "rss",
      category: ["security", "transport", "justice"],
      location: { country: "CM", city: "Yaoundé" },
      credibility: 0.6,
      language: "en",
      enabled: true
    },
    {
      name: "Cameroon News Agency (CNA)",
      url: "https://cameroonnewsagency.com/feed/",
      type: "rss",
      category: ["security", "transport"],
      location: { country: "CM", city: "Buea" },
      credibility: 0.7,
      language: "en",
      enabled: true
    },
    {
      name: "Mimi Mefo Info (MMI)",
      url: "https://mimimefoinfos.com/feed/",
      type: "rss",
      category: ["security", "justice"],
      location: { country: "CM", city: "Douala" },
      credibility: 0.6,
      language: "en",
      enabled: true
    }
  ],

  // Catégories mappées aux 13 catégories JAPAP (8 économiques + 5 civiques)
  categoryMapping: {
    // Catégories économiques
    "agriculture": ["agriculture", "agricole", "agro", "ferme", "récolte", "plantation", "élevage", "pêche"],
    "assurance": ["assurance", "assureur", "prime", "sinistre", "couverture", "indemnité", "garantie"],
    "education": ["éducation", "education", "école", "université", "enseignement", "élève", "étudiant", "formation", "bac", "examen"],
    "energie": ["énergie", "energy", "électricité", "AES-SONEL", "ENEO", "coupure", "délestage", "barrage", "centrale"],
    "finance": ["finance", "banque", "bank", "crédit", "prêt", "économie", "monnaie", "budget", "impôt", "fiscal"],
    "mines": ["mines", "minier", "mining", "extraction", "minerai", "exploitation", "gisement", "cobalt", "bauxite"],
    "sante": ["santé", "health", "hôpital", "hospital", "médecin", "maladie", "soins", "épidémie", "vaccin", "covid", "paludisme"],
    "travaux-publics": ["travaux publics", "public works", "infrastructure", "construction", "route", "pont", "autoroute", "bâtiment"],

    // Catégories civiques (nouvelles)
    "securite": ["sécurité", "security", "police", "gendarmerie", "criminalité", "crime", "vol", "theft", "agression", "violence", "cambriolage", "kidnapping", "enlèvement"],
    "transport": ["transport", "transportation", "route", "road", "accident", "circulation", "trafic", "traffic", "collision", "véhicule", "car", "moto", "bus"],
    "catastrophes": ["catastrophe", "disaster", "inondation", "flood", "incendie", "fire", "explosion", "glissement de terrain", "landslide", "effondrement", "urgence", "emergency"],
    "justice": ["justice", "tribunal", "court", "procès", "trial", "jugement", "condamnation", "sentence", "arrestation", "arrest", "détention", "prison"],
    "meteo": ["météo", "weather", "pluie", "rain", "climat", "climate", "tempête", "storm", "orage", "prévision", "forecast", "inondation"],
    "economie": ["économie", "economy", "économique", "economic", "croissance", "growth", "PIB", "GDP", "commerce", "trade", "marché", "market", "inflation", "prix", "prices", "exportation", "importation"]
  },

  // Catégories à exclure (articles non pertinents)
  excludedCategories: [
    "sport", "sports", "football", "soccer", "basket", "basketball",
    "tennis", "athlétisme", "rugby", "championnat", "coupe",
    "people", "célébrité", "celebrity", "star", "divertissement",
    "entertainment", "mode", "fashion", "beauté", "beauty"
  ],

  // Mots-clés à exclure (blacklist)
  blacklistKeywords: [
    // Sport
    "match", "but", "goal", "victoire", "défaite", "win", "lose",
    "championnat", "championship", "coupe", "cup", "équipe", "team",
    "joueur", "player", "entraîneur", "coach", "stade", "stadium",

    // People/Divertissement
    "people", "star", "célébrité", "celebrity", "mariage célébrité",
    "divorce célébrité", "scandale people", "rumeur people",

    // Mode/Beauté
    "défilé", "fashion show", "collection", "mannequin", "model",
    "maquillage", "makeup", "coiffure", "hairstyle"
  ],

  // Mots-clés pour le scoring de pertinence
  relevanceKeywords: {
    high: [
      "urgent", "alerte", "alert", "accident grave", "décès", "mort", "death",
      "incendie", "fire", "explosion", "urgence", "emergency", "danger",
      "attentat", "attaque", "attack", "victime", "blessé", "injured"
    ],
    medium: [
      "accident", "perturbation", "manifestation", "grève", "strike",
      "fermeture", "closure", "coupure", "panne", "breakdown",
      "arrestation", "arrest", "saisie", "seizure"
    ],
    low: [
      "information", "annonce", "announcement", "rappel", "reminder",
      "avis", "notice", "communiqué", "statement"
    ]
  },

  // Villes camerounaises pour géolocalisation
  cameroonCities: [
    "Yaoundé", "Douala", "Garoua", "Bafoussam", "Bamenda", "Maroua",
    "Ngaoundéré", "Bertoua", "Kribi", "Limbé", "Limbe", "Edéa", "Kumba",
    "Buéa", "Buea", "Ebolowa", "Nkongsamba", "Loum", "Foumban",
    "Dschang", "Mbalmayo", "Mbouda", "Bafang", "Nanga-Eboko"
  ],

  // Configuration de scraping par défaut
  defaults: {
    maxArticlesPerSource: 20,
    requestTimeout: 30000,
    respectRobotsTxt: true,
    userAgent: "JapapKioskBot/1.0",
    retryAttempts: 3,
    retryDelay: 2000
  }
};
