# Phase 1 - Commandes d'Installation et de Démarrage

Commandes à exécuter pour mettre en place le système d'actualités JAPAP.

## 🚀 Installation Rapide (Copy-Paste)

### 1. Migration Base de Données

```bash
# Aller dans le backend
cd japap-backend

# Appliquer la migration Prisma (crée les tables NewsArticle et NewsSource)
npx prisma migrate dev --name add_news_aggregation_system

# Générer le client Prisma
npx prisma generate

# Vérifier la migration (optionnel)
npx prisma studio
```

### 2. Installation du Scraper

```bash
# Aller dans le scraper
cd ../japap-scraper

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# IMPORTANT : Éditer .env et ajouter votre DATABASE_URL
# Exemple: DATABASE_URL="postgresql://user:password@localhost:5432/japap?schema=public"
```

**Sur Windows (PowerShell) :**
```powershell
cd ..\japap-scraper
npm install
Copy-Item .env.example .env
# Puis éditer .env avec notepad ou VS Code
```

### 3. Configuration Minimale du .env

Ouvrir `japap-scraper/.env` et ajouter **au minimum** :

```env
DATABASE_URL="postgresql://votre_user:votre_password@localhost:5432/japap?schema=public"
```

Les autres variables ont des valeurs par défaut :
```env
SCRAPING_INTERVAL="0 */2 * * *"  # Toutes les 2 heures
MAX_ARTICLES_PER_SOURCE=20
RUN_ON_START=true
REQUEST_TIMEOUT=30000
```

### 4. Test Rapide

```bash
# Tester le scraper
cd japap-scraper
node test-scraper.js
```

**Résultat attendu :**
```
=== JAPAP News Scraper Test ===

Test 1: Database connection...
✅ Database connected
   - Total articles: 0
   - Active sources: 0

Test 2: Scraping single source...
   Source: Cameroon Tribune
   URL: https://www.cameroon-tribune.cm/rss
✅ Scraped 15 articles

   Sample article:
   - Title: Cameroun : Nouveau projet d'infrastructure...
   - Category: infrastructure
   - Relevance: 0.65
   - Priority: medium

Test 3: Saving article to database...
✅ Article saved with ID: abc-123-xyz

=== Test completed successfully ===
```

### 5. Démarrage des Services

**Ouvrir 2 terminaux :**

**Terminal 1 - Backend :**
```bash
cd japap-backend
npm run dev
```

**Terminal 2 - Scraper :**
```bash
cd japap-scraper
npm run dev
```

**Résultat attendu (Terminal 2) :**
```
╔════════════════════════════════════════╗
║     JAPAP News Scraper Service        ║
╚════════════════════════════════════════╝

[CONFIG] Scraping interval: 0 */2 * * *
[CONFIG] Max articles per source: 20

[INFO] Running initial scraping...

[RSS] Starting scraping of 9 sources...
[RSS] Scraping Cameroon Tribune...
[RSS] Scraped 15 articles from Cameroon Tribune
[Cameroon Tribune] Saved: 12, Updated: 3, Errors: 0

...

[SCRAPER] Summary:
  - Total sources scraped: 9
  - Articles saved: 87
  - Articles updated: 15
  - Errors: 0

[INFO] Scraper is running. Press Ctrl+C to stop.
```

## ✅ Vérification

### Tester l'API Backend

```bash
# Liste des articles
curl http://localhost:4000/api/news

# Stats
curl http://localhost:4000/api/news/stats

# Articles tendances
curl http://localhost:4000/api/news/trending

# Par catégorie
curl http://localhost:4000/api/news/category/sécurité
```

**Avec PowerShell (Windows) :**
```powershell
Invoke-WebRequest http://localhost:4000/api/news | Select-Object -Expand Content
```

### Vérifier la Base de Données

```bash
cd japap-backend
npx prisma studio
```

1. Ouvrir `NewsArticle` → Vous devriez voir les articles
2. Ouvrir `NewsSource` → Vous devriez voir les sources

## 🐳 Déploiement Docker (Optionnel)

### Option 1 : Docker Compose

```bash
cd japap-scraper

# Créer un fichier .env avec DATABASE_URL

# Build et démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Option 2 : Docker simple

```bash
cd japap-scraper

# Build
docker build -t japap-scraper .

# Run
docker run -d \
  --name japap-scraper \
  -e DATABASE_URL="postgresql://user:password@host:5432/japap" \
  --restart unless-stopped \
  japap-scraper

# Logs
docker logs -f japap-scraper
```

## 🔧 Déploiement Production (PM2)

### Installation PM2

```bash
npm install -g pm2
```

### Démarrer le scraper

```bash
cd japap-scraper

# Démarrer
pm2 start src/index.js --name japap-scraper

# Sauvegarder la config
pm2 save

# Auto-démarrage au boot
pm2 startup
# Suivre les instructions affichées
```

### Commandes PM2 Utiles

```bash
# Voir les logs
pm2 logs japap-scraper

# Monitoring en temps réel
pm2 monit

# Status
pm2 status

# Redémarrer
pm2 restart japap-scraper

# Arrêter
pm2 stop japap-scraper

# Supprimer
pm2 delete japap-scraper
```

## 📊 Monitoring

### Logs en temps réel

**Développement (nodemon) :**
```bash
cd japap-scraper
npm run dev
# Les logs s'affichent automatiquement
```

**Production (PM2) :**
```bash
pm2 logs japap-scraper --lines 100
```

**Docker :**
```bash
docker logs -f japap-scraper
```

### Vérifier les stats

```bash
# Via API
curl http://localhost:4000/api/news/stats

# Via Prisma Studio
cd japap-backend
npx prisma studio
```

## 🛠️ Dépannage

### Erreur : "Cannot find module '@prisma/client'"

```bash
cd japap-backend
npx prisma generate
```

### Erreur : "Connection refused" PostgreSQL

```bash
# Vérifier que PostgreSQL tourne

# Windows
services.msc
# Chercher "postgresql" et démarrer

# Linux/Mac
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Aucun article scrapé

```bash
# Vérifier qu'une source RSS est accessible
curl https://www.journalducameroun.com/feed/

# Ou avec PowerShell
Invoke-WebRequest https://www.journalducameroun.com/feed/
```

### Prisma migration error

```bash
cd japap-backend

# Réinitialiser les migrations (ATTENTION: perte de données)
npx prisma migrate reset

# Ou créer une nouvelle migration
npx prisma migrate dev --name fix_news_schema
```

## 🔄 Mise à Jour

### Ajouter une nouvelle source RSS

1. **Éditer** `japap-scraper/src/config/sources.js`

```javascript
{
  name: "Ma Nouvelle Source",
  url: "https://example.com/feed.xml",
  type: "rss",
  category: ["général"],
  location: { country: "CM", city: "Douala" },
  enabled: true
}
```

2. **Redémarrer** le scraper

```bash
# PM2
pm2 restart japap-scraper

# Docker
docker-compose restart

# Développement
# Ctrl+C puis npm run dev
```

### Changer l'intervalle de scraping

1. **Éditer** `japap-scraper/.env`

```env
# Toutes les heures
SCRAPING_INTERVAL="0 * * * *"

# Toutes les 30 minutes
SCRAPING_INTERVAL="*/30 * * * *"

# Toutes les 6 heures
SCRAPING_INTERVAL="0 */6 * * *"
```

2. **Redémarrer** le scraper (voir ci-dessus)

## 📝 Commandes Essentielles Récapitulées

### Installation (une seule fois)
```bash
cd japap-backend && npx prisma migrate dev --name add_news_system && npx prisma generate
cd ../japap-scraper && npm install && cp .env.example .env
# Éditer .env avec DATABASE_URL
```

### Démarrage quotidien (développement)
```bash
# Terminal 1
cd japap-backend && npm run dev

# Terminal 2
cd japap-scraper && npm run dev
```

### Test rapide
```bash
cd japap-scraper && node test-scraper.js
curl http://localhost:4000/api/news/stats
```

### Production (PM2)
```bash
cd japap-scraper
pm2 start src/index.js --name japap-scraper
pm2 save
pm2 logs japap-scraper
```

## 🎯 Prochaine Étape

Une fois le scraper opérationnel, passer à l'intégration mobile :

1. Créer `japap/app/(tabs)/news.tsx`
2. Créer les composants d'affichage
3. Intégrer l'API `/api/news`

Voir : **Phase 2 - Intégration Mobile** (à venir)

---

**Phase 1 Backend - PRÊT** ✅
