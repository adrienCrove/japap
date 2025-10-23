import { Article } from '@/types/article';

// Données mockées pour les articles de news
export const MOCK_ARTICLES: Article[] = [
  // Agriculture
  {
    id: 'article-1',
    title: 'Nouveau programme de soutien agricole pour 50,000 fermiers',
    content: `Le gouvernement camerounais lance un ambitieux programme de soutien à l'agriculture qui bénéficiera à plus de 50,000 fermiers à travers le pays. Cette initiative vise à moderniser les pratiques agricoles et à augmenter la productivité.

Le ministre de l'Agriculture a annoncé que ce programme comprendra la distribution de semences améliorées, d'engrais subventionnés et de matériel agricole moderne. Les fermiers bénéficieront également de formations sur les techniques agricoles durables.

"Cette initiative représente un investissement majeur dans notre secteur agricole", a déclaré le ministre lors de la cérémonie de lancement à Bafoussam. "Nous visons à augmenter la production alimentaire de 40% d'ici 2027."

Le programme mettra également l'accent sur l'agriculture biologique et les cultures de rente comme le cacao, le café et le coton. Des coopératives agricoles seront créées pour faciliter l'accès aux marchés et améliorer la commercialisation des produits.`,
    heroImage: 'https://picsum.photos/800/600?random=101',
    category: 'Agriculture',
    author: {
      name: 'Marie Kouam',
      initials: 'MK',
      backgroundColor: '#10B981',
    },
    source: {
      name: 'CamerounInfo',
      logo: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=CI',
    },
    readingTime: 5,
    views: 45000,
    publishedAt: 'Il y a 2h',
    sources: ['Ministère de l\'Agriculture', 'MINADER', 'CamerounInfo', 'Reuters'],
    likes: 1200,
    comments: 89,
    shares: 156,
    isBookmarked: false,
    relatedArticles: [],
  },

  // Assurance
  {
    id: 'article-2',
    title: 'Nouvelle offre d\'assurance maladie accessible à tous',
    content: `Une compagnie d'assurance camerounaise majeure a annoncé le lancement d'une offre d'assurance santé révolutionnaire à prix réduit, spécialement conçue pour les familles à revenus modestes.

Cette nouvelle formule d'assurance propose une couverture médicale complète avec des primes mensuelles adaptées aux budgets familiaux limités. Elle inclut les consultations médicales, les hospitalisations, les médicaments essentiels et les examens de laboratoire.

Le directeur général de la compagnie a souligné que cette initiative s'inscrit dans une démarche de responsabilité sociale. "Nous voulons rendre l'assurance santé accessible à tous les Camerounais, quelle que soit leur situation économique", a-t-il déclaré.

Le programme pilote débutera dans les villes de Douala et Yaoundé avant d'être étendu à l'ensemble du territoire national. Plus de 100,000 familles devraient en bénéficier au cours de la première année.`,
    heroImage: 'https://picsum.photos/800/600?random=102',
    category: 'Assurance',
    author: {
      name: 'Jean-Paul Mbida',
      initials: 'JPM',
      backgroundColor: '#3B82F6',
    },
    source: {
      name: 'FinanceActu',
      logo: 'https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=FA',
    },
    readingTime: 4,
    views: 32000,
    publishedAt: 'Il y a 4h',
    sources: ['Compagnie d\'Assurance', 'FinanceActu', 'EcoNews'],
    likes: 890,
    comments: 45,
    shares: 78,
    isBookmarked: false,
    relatedArticles: [],
  },

  // Éducation
  {
    id: 'article-3',
    title: 'Lancement de tablettes numériques dans 100 écoles',
    content: `Le ministère de l'Éducation de Base a officiellement lancé un programme ambitieux de digitalisation de l'enseignement avec la distribution de tablettes numériques à 100 écoles primaires à travers le pays.

Cette initiative innovante vise à favoriser l'apprentissage digital et à préparer les élèves aux défis du 21e siècle. Chaque école recevra 50 tablettes équipées de contenus éducatifs interactifs adaptés au programme scolaire camerounais.

Les enseignants bénéficieront également d'une formation complète sur l'utilisation pédagogique de ces outils numériques. "Nous entrons dans une nouvelle ère de l'éducation", a affirmé la ministre de l'Éducation de Base lors de la cérémonie de lancement.

Le programme comprend aussi l'installation de connexions internet dans les écoles concernées et la création de contenus éducatifs locaux. Cette phase pilote sera évaluée avant une extension à 500 écoles supplémentaires.`,
    heroImage: 'https://picsum.photos/800/600?random=103',
    category: 'Éducation',
    author: {
      name: 'Ama Traoré',
      initials: 'AT',
      backgroundColor: '#8B5CF6',
    },
    source: {
      name: 'EduCameroun',
      logo: 'https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=EC',
    },
    readingTime: 6,
    views: 78000,
    publishedAt: 'Il y a 5h',
    sources: ['MINEDUB', 'EduCameroun', 'UNESCO', 'Education Times'],
    likes: 2100,
    comments: 156,
    shares: 234,
    isBookmarked: false,
    relatedArticles: [],
  },

  // Énergie
  {
    id: 'article-4',
    title: 'Nouveau barrage hydroélectrique de 150 MW inauguré',
    content: `Le président de la République a inauguré le barrage hydroélectrique de Nachtigal, une infrastructure majeure qui va transformer le paysage énergétique du Cameroun. Ce projet d'envergure augmentera la production électrique nationale de 30%.

Avec une capacité de 150 mégawatts, le barrage de Nachtigal permettra de réduire significativement les délestages qui affectent régulièrement les zones urbaines et industrielles. Le projet a nécessité un investissement de plusieurs milliards de francs CFA.

"Cette infrastructure représente un tournant décisif pour notre développement économique", a déclaré le chef de l'État. "L'accès à une électricité stable et abondante est essentiel pour notre industrialisation."

Le barrage alimentera principalement les régions du Centre, du Littoral et du Sud, tout en créant des emplois durables pour les communautés locales. Des mesures environnementales strictes ont été mises en place pour préserver l'écosystème fluvial.`,
    heroImage: 'https://picsum.photos/800/600?random=104',
    category: 'Énergie',
    author: {
      name: 'Thomas Nkomo',
      initials: 'TN',
      backgroundColor: '#F59E0B',
    },
    source: {
      name: 'EnergieInfo',
      logo: 'https://via.placeholder.com/40x40/F59E0B/FFFFFF?text=EI',
    },
    readingTime: 7,
    views: 95000,
    publishedAt: 'Il y a 6h',
    sources: ['Présidence', 'ENEO', 'EnergieInfo', 'AFP', 'Reuters'],
    likes: 3200,
    comments: 234,
    shares: 456,
    isBookmarked: false,
    relatedArticles: [],
  },

  // Finance
  {
    id: 'article-5',
    title: 'Lancement d\'une plateforme de mobile banking pour PME',
    content: `Une institution financière camerounaise de premier plan a dévoilé une nouvelle solution révolutionnaire de paiement mobile spécialement conçue pour répondre aux besoins des petites et moyennes entreprises.

Cette plateforme innovante permettra aux PME de gérer leurs transactions commerciales de manière digitale, facilitant ainsi les paiements, les transferts et la gestion de trésorerie. L'interface intuitive a été développée en tenant compte des spécificités du marché local.

Le directeur général de l'institution a expliqué que cette solution vise à réduire la dépendance aux transactions en espèces et à favoriser l'inclusion financière des entrepreneurs. "Les PME représentent 90% du tissu économique camerounais", a-t-il souligné.

La plateforme offre également des fonctionnalités avancées comme la génération de factures électroniques, le suivi des paiements clients et l'accès à des microcrédits. Plus de 5,000 PME sont déjà inscrites en phase bêta.`,
    heroImage: 'https://picsum.photos/800/600?random=105',
    category: 'Finance',
    author: {
      name: 'Sarah Dibango',
      initials: 'SD',
      backgroundColor: '#EC4899',
    },
    source: {
      name: 'EcoFinance',
      logo: 'https://via.placeholder.com/40x40/EC4899/FFFFFF?text=EF',
    },
    readingTime: 5,
    views: 52000,
    publishedAt: 'Il y a 8h',
    sources: ['Banque Centrale', 'EcoFinance', 'Bloomberg', 'Financial Times'],
    likes: 1450,
    comments: 89,
    shares: 167,
    isBookmarked: false,
    relatedArticles: [],
  },

  // Mines
  {
    id: 'article-6',
    title: 'Nouveau gisement de cobalt découvert dans l\'Est',
    content: `Une équipe de géologues internationaux a annoncé la découverte d'un important gisement de cobalt dans la région de l'Est du Cameroun, ouvrant des perspectives économiques majeures pour le pays.

Ce gisement, situé près de Bertoua, pourrait contenir plusieurs milliers de tonnes de cobalt, un minéral stratégique essentiel à la fabrication de batteries pour véhicules électriques et appareils électroniques. Les premières estimations suggèrent des réserves considérables.

Le ministre des Mines, de l'Industrie et du Développement Technologique a salué cette découverte comme "une opportunité historique pour diversifier notre économie". Le gouvernement prévoit d'attirer des investisseurs responsables pour l'exploitation de ce gisement.

Des études d'impact environnemental et social sont déjà en cours pour garantir une exploitation durable respectueuse des communautés locales et de l'environnement. La phase d'exploration approfondie devrait durer 18 mois.`,
    heroImage: 'https://picsum.photos/800/600?random=106',
    category: 'Mines',
    author: {
      name: 'Pierre Ngassa',
      initials: 'PN',
      backgroundColor: '#6366F1',
    },
    source: {
      name: 'MinesActu',
      logo: 'https://via.placeholder.com/40x40/6366F1/FFFFFF?text=MA',
    },
    readingTime: 6,
    views: 67000,
    publishedAt: 'Il y a 10h',
    sources: ['MINMIDT', 'MinesActu', 'Mining Weekly', 'Reuters'],
    likes: 1800,
    comments: 178,
    shares: 234,
    isBookmarked: false,
    relatedArticles: [],
  },

  // Santé
  {
    id: 'article-7',
    title: 'Campagne de vaccination gratuite lancée dans 5 régions',
    content: `Le ministère de la Santé Publique a officiellement lancé une vaste campagne nationale de vaccination gratuite contre la rougeole et la poliomyélite, ciblant tous les enfants de moins de 5 ans dans cinq régions du pays.

Cette initiative sanitaire d'envergure mobilise plus de 2,000 professionnels de santé qui se déploieront dans les zones urbaines et rurales pour atteindre le maximum d'enfants. L'objectif est de vacciner au moins 1,5 million d'enfants en trois mois.

La ministre de la Santé Publique a insisté sur l'importance de cette campagne : "La vaccination est le moyen le plus efficace de protéger nos enfants contre ces maladies potentiellement mortelles. C'est un devoir parental et une responsabilité collective."

Des centres de vaccination temporaires ont été installés dans les écoles, les centres de santé et même dans certains marchés pour faciliter l'accès. La campagne bénéficie du soutien de l'OMS et de l'UNICEF.`,
    heroImage: 'https://picsum.photos/800/600?random=107',
    category: 'Santé',
    author: {
      name: 'Dr. Éric Fouda',
      initials: 'EF',
      backgroundColor: '#EF4444',
    },
    source: {
      name: 'SantéPlus',
      logo: 'https://via.placeholder.com/40x40/EF4444/FFFFFF?text=SP',
    },
    readingTime: 5,
    views: 125000,
    publishedAt: 'Il y a 12h',
    sources: ['MINSANTE', 'OMS', 'UNICEF', 'SantéPlus', 'Africa Health'],
    likes: 4200,
    comments: 267,
    shares: 589,
    isBookmarked: false,
    relatedArticles: [],
  },

  // Travaux Publics
  {
    id: 'article-8',
    title: 'Autoroute Yaoundé-Douala : 75% des travaux achevés',
    content: `Les travaux de construction de l'autoroute à péage Yaoundé-Douala progressent à un rythme soutenu avec 75% de réalisation physique, selon les dernières données du ministère des Travaux Publics. La livraison est maintenant prévue pour 2026.

Cette infrastructure majeure de 250 kilomètres transformera le transport entre les deux principales villes du pays, réduisant le temps de trajet de 4 heures actuellement à seulement 2 heures 30. L'autoroute comprendra 4 voies avec des aires de repos modernes.

Le ministre des Travaux Publics a effectué une visite d'inspection sur le chantier à Édéa et s'est déclaré satisfait de l'avancement des travaux. "Cette autoroute va dynamiser notre économie et faciliter les échanges commerciaux", a-t-il affirmé.

Le projet inclut également la construction de 15 échangeurs, 8 aires de service, et des systèmes de sécurité routière de dernière génération. Plus de 3,000 emplois directs ont été créés pendant la phase de construction.`,
    heroImage: 'https://picsum.photos/800/600?random=108',
    category: 'Travaux Publics',
    author: {
      name: 'Claudine Essomba',
      initials: 'CE',
      backgroundColor: '#14B8A6',
    },
    source: {
      name: 'InfraActu',
      logo: 'https://via.placeholder.com/40x40/14B8A6/FFFFFF?text=IA',
    },
    readingTime: 6,
    views: 89000,
    publishedAt: 'Il y a 14h',
    sources: ['MINTP', 'InfraActu', 'Construction News', 'AFP'],
    likes: 2300,
    comments: 145,
    shares: 298,
    isBookmarked: false,
    relatedArticles: [],
  },
];

// Fonction pour créer les relations entre articles
export function enrichArticlesWithRelated(articles: Article[]): Article[] {
  return articles.map((article) => {
    // Trouver 4 articles de la même catégorie (ou même source) sauf lui-même
    const related = articles
      .filter(
        (a) =>
          a.id !== article.id &&
          (a.category === article.category || a.source.name === article.source.name)
      )
      .slice(0, 4);

    return {
      ...article,
      relatedArticles: related.length > 0 ? related : undefined,
    };
  });
}

// Export des articles enrichis avec relations
export const ENRICHED_ARTICLES = enrichArticlesWithRelated(MOCK_ARTICLES);
