export interface ArticleAuthor {
  name: string;
  avatar?: string;
  initials: string;
  backgroundColor?: string; // Couleur de fond pour l'avatar avec initiales
}

export interface ArticleSource {
  name: string;
  logo?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string; // Contenu complet de l'article
  heroImage: string; // Image principale plein écran
  category: string;

  author: ArticleAuthor;
  source: ArticleSource;

  readingTime: number; // Durée de lecture en minutes
  views: number;
  publishedAt: string; // Format: "Il y a 2h", "Hier", etc.

  sources: string[]; // Liste des sources citées dans l'article
  relatedArticles?: Article[]; // Articles similaires (même catégorie ou source)

  // Optionnel pour les interactions
  likes?: number;
  comments?: number;
  shares?: number;
  isBookmarked?: boolean;
}
