# JAPAP News Scraper

Service d'agrégation et de scraping d'actualités pour la plateforme JAPAP.

## Description

Ce service collecte automatiquement des actualités depuis diverses sources (RSS feeds, sites web) et les stocke dans la base de données PostgreSQL pour être affichées dans l'application mobile JAPAP.

## Fonctionnalités

- **Scraping RSS** : Collecte d'articles depuis des flux RSS configurables
- **Catégorisation automatique** : Classification des articles par catégorie (sécurité, santé, transport, etc.)
- **Scoring de pertinence** : Attribution d'un score de pertinence basé sur des mots-clés
- **Détection de doublons** : Évite l'insertion d'articles en double
- **Planification automatique** : Exécution périodique via cron jobs
- **Nettoyage automatique** : Suppression des articles trop anciens

## Installation

### Prérequis

- Node.js >= 14
- PostgreSQL
- Accès à la base de données JAPAP

### Étapes d'installation

1. **Installer les dépendances** :
```bash
cd japap-scraper
npm install
```

2. **Configurer l'environnement** :
```bash
cp .env.example .env
```

3. **Éditer le fichier `.env`** :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/japap?schema=public"
SCRAPING_INTERVAL="0 */2 * * *"  # Toutes les 2 heures
MAX_ARTICLES_PER_SOURCE=20
RUN_ON_START=true  # Exécuter au démarrage
```

4. **Appliquer les migrations Prisma** (depuis japap-backend):
```bash
cd ../japap-backend
npx prisma migrate dev --name add_news_models
npx prisma generate
```

## Configuration des sources

Les sources d'actualités sont configurées dans `src/config/sources.js`.

### Ajouter une nouvelle source

```javascript
{
  name: "Nom de la source",
  url: "https://example.com/rss",
  type: "rss",
  category: ["général", "politique"],
  location: { country: "CM", city: "Yaoundé" },
  enabled: true
}
```

## Utilisation

### Démarrage en mode développement

```bash
npm run dev
```

### Démarrage en production

```bash
npm start
```

### Exécution manuelle unique

```bash
node src/index.js
```

## Architecture

```
japap-scraper/
├── src/
│   ├── config/
│   │   └── sources.js          # Configuration des sources RSS
│   ├── services/
│   │   ├── rssScraper.js       # Service de scraping RSS
│   │   └── databaseService.js  # Service de sauvegarde DB
│   ├── utils/
│   │   └── newsUtils.js        # Utilitaires (catégorisation, scoring)
│   └── index.js                # Point d'entrée principal
├── package.json
├── .env.example
└── README.md
```

## Flux de travail

1. **Collecte** : Le scraper récupère les articles depuis les flux RSS
2. **Parsing** : Extraction des métadonnées (titre, contenu, images, date)
3. **Enrichissement** : Catégorisation, scoring de pertinence, détection de langue
4. **Sauvegarde** : Insertion ou mise à jour dans PostgreSQL via Prisma
5. **Stats** : Mise à jour des statistiques des sources

## Catégories d'articles

Les articles sont automatiquement catégorisés selon les types d'alertes JAPAP :

- **Sécurité** : Incidents de sécurité, police, criminalité
- **Accident** : Accidents de la route, collisions
- **Santé** : Urgences médicales, épidémies
- **Infrastructure** : Travaux, routes, coupures
- **Météo** : Événements météorologiques, catastrophes
- **Événement** : Manifestations, événements publics
- **Général** : Actualités générales

## Scoring de pertinence

Le score de pertinence (0.0 - 1.0) est calculé selon :

- **Mots-clés haute priorité** (+0.3) : urgent, alerte, accident grave, décès, incendie
- **Mots-clés moyenne priorité** (+0.15) : accident, perturbation, manifestation
- **Catégorie pertinente** (+0.1) : sécurité, accident, santé, infrastructure
- **Article récent** (+0.05) : publié aujourd'hui

## Cron Jobs

### Scraping périodique
Par défaut : toutes les 2 heures (`0 */2 * * *`)

### Nettoyage automatique
Par défaut : tous les jours à 3h du matin (`0 3 * * *`)
Supprime les articles de plus de 30 jours

## API Backend

Les articles scrapés sont accessibles via les routes backend :

- `GET /api/news` - Liste paginée
- `GET /api/news/:id` - Détail par ID
- `GET /api/news/slug/:slug` - Détail par slug
- `GET /api/news/category/:category` - Par catégorie
- `GET /api/news/trending` - Articles tendances
- `GET /api/news/related/:alertId` - Liés à une alerte
- `GET /api/news/stats` - Statistiques

## Monitoring

Le service affiche des logs détaillés :

```
[RSS] Scraping Cameroon Tribune...
[RSS] Scraped 15 articles from Cameroon Tribune
[DB] Article saved: Nouvel accident sur l'autoroute...
[Cameroon Tribune] Saved: 12, Updated: 3, Errors: 0

[SCRAPER] Summary:
  - Total sources scraped: 9
  - Articles saved: 87
  - Articles updated: 15
  - Errors: 2
```

## Déploiement

### Sur VPS Hostinger (avec Portainer)

1. **Créer un Dockerfile** :
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

2. **Docker Compose** :
```yaml
version: '3.8'
services:
  japap-scraper:
    build: .
    environment:
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

3. **Déployer via Portainer** sur votre VPS Hostinger

### Alternative : PM2

```bash
npm install -g pm2
pm2 start src/index.js --name japap-scraper
pm2 save
pm2 startup
```

## Dépannage

### Erreur de connexion à la base de données
Vérifier que `DATABASE_URL` dans `.env` est correct

### Articles non sauvegardés
Vérifier que les migrations Prisma ont été appliquées

### Sources ne retournant aucun article
Vérifier que les URLs RSS sont valides et accessibles

## Prochaines étapes (Phase 2)

- Intégration LangChain pour résumé IA
- Indexation Elasticsearch pour recherche avancée
- Scraping de sites web (Puppeteer)
- Corrélation automatique alertes ↔ actualités
- Téléchargement et stockage d'images sur O2switch

## Support

Pour toute question ou problème, consulter la documentation principale du projet JAPAP.
