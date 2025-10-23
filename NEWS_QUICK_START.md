# Démarrage Rapide - Système d'Actualités JAPAP

Guide ultra-rapide pour démarrer le système d'agrégation d'actualités en 5 minutes.

## Prérequis

- Node.js >= 14
- PostgreSQL en cours d'exécution
- Backend JAPAP installé

## Installation en 4 Étapes

### 1️⃣ Migration Base de Données (2 min)

```bash
cd japap-backend
npx prisma migrate dev --name add_news_system
npx prisma generate
```

### 2️⃣ Configuration Scraper (1 min)

```bash
cd ../japap-scraper
npm install
cp .env.example .env
```

Éditer `.env` - **UNIQUEMENT cette ligne est obligatoire :**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/japap?schema=public"
```

### 3️⃣ Test du Scraper (1 min)

```bash
node test-scraper.js
```

Vous devriez voir :
```
✅ Database connected
✅ Scraped 15 articles
✅ Article saved with ID: xxx
```

### 4️⃣ Démarrage des Services (1 min)

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

## Vérification

**Tester l'API :**
```bash
curl http://localhost:4000/api/news
```

**Afficher les stats :**
```bash
curl http://localhost:4000/api/news/stats
```

## Routes API Disponibles

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | Liste paginée |
| `GET /api/news/trending` | Articles tendances |
| `GET /api/news/category/sécurité` | Par catégorie |
| `GET /api/news/stats` | Statistiques |

## Configuration Avancée (Optionnel)

### Changer l'intervalle de scraping

Éditer `japap-scraper/.env` :
```env
SCRAPING_INTERVAL="0 */1 * * *"  # Toutes les heures
```

### Ajouter/Modifier des sources RSS

Éditer `japap-scraper/src/config/sources.js` :
```javascript
{
  name: "Ma Source",
  url: "https://example.com/feed.xml",
  type: "rss",
  category: ["général"],
  location: { country: "CM" },
  enabled: true
}
```

### Désactiver une source

Dans `sources.js`, mettre `enabled: false`

## Dépannage Express

### "Cannot find module '@prisma/client'"
```bash
cd japap-backend
npx prisma generate
```

### "Connection refused" DB
Vérifier que PostgreSQL tourne :
```bash
# Windows
services.msc → PostgreSQL

# Linux/Mac
sudo systemctl status postgresql
```

### Aucun article scrapé
Tester manuellement une URL RSS :
```bash
curl https://www.journalducameroun.com/feed/
```

## Que se passe-t-il ensuite ?

1. **Le scraper tourne en continu** et collecte des articles toutes les 2 heures
2. **Les articles sont stockés** dans PostgreSQL (`news_articles`)
3. **L'API expose** les articles via `/api/news`
4. **Prochaine étape** : Créer l'interface mobile dans `japap/app/(tabs)/news.tsx`

## Arrêter les Services

```bash
# Ctrl+C dans les terminaux
# Ou
pkill -f "node src/index.js"
```

## Déploiement Production (30 sec)

**Avec PM2 :**
```bash
cd japap-scraper
npm install -g pm2
pm2 start src/index.js --name japap-scraper
pm2 save
```

**Monitorer :**
```bash
pm2 logs japap-scraper
pm2 monit
```

---

**C'est tout !** 🎉

Votre système d'actualités style Perplexity Discover est opérationnel.

Prochaine étape : Voir [NEWS_SYSTEM_INSTALLATION.md](./NEWS_SYSTEM_INSTALLATION.md) pour l'intégration mobile.
