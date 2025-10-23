// Catégories d'actualités avec déclinaisons de la couleur primaire #E94F23

export interface NewsCategory {
  id: string;
  name: string;
  color: string;        // Couleur principale pour texte et bordure
  colorLight: string;   // Couleur claire pour fond badge inactif
}

// Liste des 13 catégories d'actualités (8 économiques + 5 civiques)
export const NEWS_CATEGORIES: NewsCategory[] = [
  // Catégories économiques (variations de #E94F23)
  {
    id: 'agriculture',
    name: 'Agriculture',
    color: '#E94F23',
    colorLight: '#FFF3F0',
  },
  {
    id: 'assurance',
    name: 'Assurance',
    color: '#F56B47',
    colorLight: '#FFF5F2',
  },
  {
    id: 'education',
    name: 'Éducation',
    color: '#F7876B',
    colorLight: '#FFF7F4',
  },
  {
    id: 'energie',
    name: 'Énergie',
    color: '#F9A38F',
    colorLight: '#FFF9F6',
  },
  {
    id: 'finance',
    name: 'Finance',
    color: '#FBBFB3',
    colorLight: '#FFFBF9',
  },
  {
    id: 'mines',
    name: 'Mines',
    color: '#FDDBD7',
    colorLight: '#FFFDFC',
  },
  {
    id: 'sante',
    name: 'Santé',
    color: '#D94419',
    colorLight: '#FFF1ED',
  },
  {
    id: 'travaux-publics',
    name: 'Travaux Publics',
    color: '#C63D16',
    colorLight: '#FFEFEB',
  },

  // Catégories civiques (couleurs distinctes)
  {
    id: 'securite',
    name: 'Sécurité',
    color: '#DC2626',      // Rouge - urgence/danger
    colorLight: '#FEE2E2',
  },
  {
    id: 'transport',
    name: 'Transport',
    color: '#2563EB',      // Bleu - routes/circulation
    colorLight: '#DBEAFE',
  },
  {
    id: 'catastrophes',
    name: 'Catastrophes',
    color: '#7C3AED',      // Violet - événements majeurs
    colorLight: '#EDE9FE',
  },
  {
    id: 'justice',
    name: 'Justice',
    color: '#0891B2',      // Cyan - système judiciaire
    colorLight: '#CFFAFE',
  },
  {
    id: 'meteo',
    name: 'Météo',
    color: '#059669',      // Vert - climat/nature
    colorLight: '#D1FAE5',
  },
  {
    id: 'economie',
    name: 'Économie',
    color: '#F59E0B',      // Orange/Ambre - économie générale
    colorLight: '#FEF3C7',
  },
];

// Fonction helper pour récupérer une catégorie par son nom
export const getCategoryByName = (name: string): NewsCategory | undefined => {
  return NEWS_CATEGORIES.find(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );
};

// Fonction helper pour récupérer une catégorie par son ID
export const getCategoryById = (id: string): NewsCategory | undefined => {
  return NEWS_CATEGORIES.find(cat => cat.id === id);
};
