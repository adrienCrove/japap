# Installation du Système d'Actualités JAPAP

Guide complet pour installer et configurer le système d'agrégation d'actualités style Perplexity Discover.

## Vue d'ensemble

Le système comprend 3 composants :

1. **japap-scraper** : Service de scraping RSS qui collecte les actualités
2. **japap-backend** : API REST qui expose les actualités via `/api/news`
3. **Base de données** : Nouveaux modèles `NewsArticle` et `NewsSource` dans PostgreSQL

## Étape 1 : Migration de la base de données

### 1.1 Appliquer la migration Prisma

```bash
cd japap-backend
npx prisma migrate dev --name add_news_aggregation_system
```

Cette commande va créer les tables :
- `news_articles` : Stockage des articles scrapés
- `news_sources` : Métadonnées et stats des sources RSS

### 1.2 Générer le client Prisma

```bash
npx prisma generate
```

### 1.3 Vérifier la migration

```bash
npx prisma studio
```

Vous devriez voir les nouvelles tables `NewsArticle` et `NewsSource`.

## Étape 2 : Configuration du Backend

### 2.1 Les routes sont déjà enregistrées

Le fichier `japap-backend/src/index.js` a été mis à jour avec :
```javascript
const newsRoutes = require('./routes/news');
app.use('/api/news', newsRoutes);
```

### 2.2 Routes API disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/news` | Liste paginée avec filtres |
| GET | `/api/news/:id` | Détail par ID |
| GET | `/api/news/slug/:slug` | Détail par slug |
| GET | `/api/news/category/:category` | Filtrer par catégorie |
| GET | `/api/news/trending` | Articles tendances |
| GET | `/api/news/related/:alertId` | Articles liés à une alerte |
| GET | `/api/news/sources` | Liste des sources |
| GET | `/api/news/stats` | Statistiques |
| POST | `/api/news` | Créer un article (admin) |
| PUT | `/api/news/:id` | Mettre à jour (admin) |
| DELETE | `/api/news/:id` | Supprimer (admin) |

### 2.3 Redémarrer le backend

```bash
cd japap-backend
npm run dev
```

Testez l'API :
```bash
curl http://localhost:4000/api/news
```

## Étape 3 : Configuration du Scraper

### 3.1 Installer les dépendances

```bash
cd japap-scraper
npm install
```

### 3.2 Configurer l'environnement

```bash
cp .env.example .env
```

Éditer `.env` :
```env
# Même DATABASE_URL que japap-backend
DATABASE_URL="postgresql://user:password@localhost:5432/japap?schema=public"

# Scraping toutes les 2 heures
SCRAPING_INTERVAL="0 */2 * * *"

# Maximum 20 articles par source
MAX_ARTICLES_PER_SOURCE=20

# Exécuter au démarrage
RUN_ON_START=true

# Timeout des requêtes
REQUEST_TIMEOUT=30000
```

### 3.3 Personnaliser les sources

Éditer `japap-scraper/src/config/sources.js` pour ajouter/modifier des sources :

```javascript
{
  name: "Ma Source",
  url: "https://example.com/feed.xml",
  type: "rss",
  category: ["général"],
  location: { country: "CM", city: "Yaoundé" },
  enabled: true
}
```

### 3.4 Tester le scraper

```bash
cd japap-scraper
npm run dev
```

Vous devriez voir :
```
╔════════════════════════════════════════╗
║     JAPAP News Scraper Service        ║
╚════════════════════════════════════════╝

[CONFIG] Scraping interval: 0 */2 * * *
[INFO] Running initial scraping...

[RSS] Scraping Cameroon Tribune...
[RSS] Scraped 15 articles from Cameroon Tribune
...
[SCRAPER] Summary:
  - Total sources scraped: 9
  - Articles saved: 87
```

## Étape 4 : Vérification

### 4.1 Vérifier la base de données

```bash
cd japap-backend
npx prisma studio
```

Ouvrir `NewsArticle` → Vous devriez voir les articles scrapés.

### 4.2 Tester les routes API

**Liste des articles :**
```bash
curl http://localhost:4000/api/news?page=1&limit=10
```

**Par catégorie :**
```bash
curl http://localhost:4000/api/news/category/sécurité
```

**Articles tendances :**
```bash
curl http://localhost:4000/api/news/trending
```

**Statistiques :**
```bash
curl http://localhost:4000/api/news/stats
```

## Étape 5 : Déploiement en Production

### Option A : Déploiement sur VPS Hostinger (avec PM2)

**1. Transférer le code sur le VPS**
```bash
scp -r japap-scraper user@your-vps:/var/www/japap/
```

**2. Installer PM2**
```bash
ssh user@your-vps
cd /var/www/japap/japap-scraper
npm install --production
npm install -g pm2
```

**3. Configurer .env en production**
```bash
nano .env
# Mettre DATABASE_URL pointant vers PostgreSQL
```

**4. Lancer avec PM2**
```bash
pm2 start src/index.js --name japap-scraper
pm2 save
pm2 startup
```

**5. Monitorer**
```bash
pm2 logs japap-scraper
pm2 monit
```

### Option B : Déploiement avec Docker (Portainer)

**1. Créer Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

**2. Créer docker-compose.yml**
```yaml
version: '3.8'
services:
  japap-scraper:
    build: .
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SCRAPING_INTERVAL: "0 */2 * * *"
      MAX_ARTICLES_PER_SOURCE: 20
    restart: unless-stopped
    networks:
      - japap-network

networks:
  japap-network:
    external: true
```

**3. Déployer via Portainer**
- Aller sur Portainer UI
- Stacks → Add Stack
- Upload docker-compose.yml
- Déployer

## Étape 6 : Planification Cron

Le scraper utilise `node-cron` en interne, mais vous pouvez aussi utiliser le cron système :

```bash
# Éditer crontab
crontab -e

# Ajouter (scraping toutes les 2 heures)
0 */2 * * * cd /var/www/japap/japap-scraper && /usr/bin/node src/index.js >> /var/log/japap-scraper.log 2>&1
```

## Paramètres de Configuration

### Interval Cron

| Pattern | Description |
|---------|-------------|
| `0 * * * *` | Toutes les heures |
| `0 */2 * * *` | Toutes les 2 heures |
| `0 */6 * * *` | Toutes les 6 heures |
| `0 0 * * *` | Tous les jours à minuit |
| `*/30 * * * *` | Toutes les 30 minutes |

### Variables d'environnement

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `DATABASE_URL` | - | Connexion PostgreSQL (requis) |
| `SCRAPING_INTERVAL` | `0 */2 * * *` | Pattern cron |
| `MAX_ARTICLES_PER_SOURCE` | `20` | Articles max par source |
| `RUN_ON_START` | `true` | Scraper au démarrage |
| `REQUEST_TIMEOUT` | `30000` | Timeout requêtes (ms) |

## Monitoring et Logs

### Logs du scraper

```bash
# PM2
pm2 logs japap-scraper

# Docker
docker logs -f japap-scraper

# Fichier
tail -f /var/log/japap-scraper.log
```

### Métriques

Consulter `/api/news/stats` pour :
- Total d'articles actifs
- Articles par catégorie
- Articles par source
- Articles des dernières 24h

## Dépannage

### Le scraper ne démarre pas

**Vérifier DATABASE_URL :**
```bash
cd japap-scraper
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

**Vérifier connexion DB :**
```bash
cd japap-backend
npx prisma db pull
```

### Aucun article scrapé

**Tester une source manuellement :**
```bash
node -e "
const Parser = require('rss-parser');
const parser = new Parser();
parser.parseURL('https://www.journalducameroun.com/feed/')
  .then(feed => console.log(feed.items.length + ' articles'))
  .catch(err => console.error(err));
"
```

### Erreurs Prisma

**Régénérer le client :**
```bash
cd japap-backend
npx prisma generate
```

**Vérifier les migrations :**
```bash
npx prisma migrate status
```

## Prochaines étapes (Phase 2)

Une fois la Phase 1 fonctionnelle, vous pourrez implémenter :

- **LangChain** : Résumés IA et catégorisation avancée
- **Elasticsearch** : Recherche full-text performante
- **Scraping web** : Sites sans RSS avec Puppeteer
- **Images O2switch** : Téléchargement et stockage sur votre serveur
- **Corrélation alertes** : Lier automatiquement actualités ↔ alertes
- **Recommandations** : Suggestions personnalisées par utilisateur

## Support

En cas de problème :
1. Vérifier les logs du scraper
2. Tester les routes API manuellement
3. Consulter Prisma Studio pour l'état de la DB
4. Vérifier que les sources RSS sont accessibles

---

**Phase 1 complétée** ✅

Vous avez maintenant :
- ✅ Modèles Prisma `NewsArticle` et `NewsSource`
- ✅ Service de scraping RSS automatisé
- ✅ API REST complète `/api/news`
- ✅ Catégorisation et scoring automatiques
- ✅ Cron jobs pour scraping périodique

Prêt pour l'intégration dans l'app mobile React Native !
