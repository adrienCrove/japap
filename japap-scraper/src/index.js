require('dotenv').config();
const cron = require('node-cron');
const RssScraper = require('./services/rssScraper');
const DatabaseService = require('./services/databaseService');

const rssScraper = new RssScraper();
const dbService = new DatabaseService();

/**
 * Fonction principale de scraping
 */
async function runScraping() {
  console.log('\n========================================');
  console.log(`[SCRAPER] Starting scraping at ${new Date().toISOString()}`);
  console.log('========================================\n');

  try {
    // Scraper toutes les sources
    const results = await rssScraper.scrapeAll();

    // Traiter les résultats
    let totalSaved = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const result of results) {
      if (result.success && result.articles.length > 0) {
        // Sauvegarder les articles dans la base de données
        const saveResults = await dbService.saveArticles(result.articles);

        totalSaved += saveResults.saved;
        totalUpdated += saveResults.updated;
        totalErrors += saveResults.errors;

        // Mettre à jour les stats de la source
        await dbService.updateSourceStats(result.source, true);
        await dbService.incrementSourceArticleCount(result.source, saveResults.saved);

        console.log(`[${result.source}] Saved: ${saveResults.saved}, Updated: ${saveResults.updated}, Errors: ${saveResults.errors}`);

      } else if (!result.success) {
        // Enregistrer l'échec de la source
        await dbService.updateSourceStats(result.source, false, result.error);
        console.error(`[${result.source}] Failed: ${result.error}`);
      }
    }

    // Afficher le résumé
    console.log('\n========================================');
    console.log('[SCRAPER] Summary:');
    console.log(`  - Total sources scraped: ${results.length}`);
    console.log(`  - Articles saved: ${totalSaved}`);
    console.log(`  - Articles updated: ${totalUpdated}`);
    console.log(`  - Errors: ${totalErrors}`);
    console.log('========================================\n');

    // Obtenir les stats globales
    const stats = await dbService.getScrapingStats();
    if (stats) {
      console.log('[SCRAPER] Database stats:');
      console.log(`  - Total active articles: ${stats.totalArticles}`);
      console.log(`  - Active sources: ${stats.activeSources}`);
      console.log(`  - Recent articles (24h): ${stats.recentArticles}`);
      console.log('');
    }

  } catch (error) {
    console.error('[SCRAPER] Fatal error:', error);
  }
}

/**
 * Nettoyage des vieux articles (optionnel)
 */
async function runCleanup() {
  console.log('[CLEANUP] Running cleanup of old articles...');
  try {
    const count = await dbService.cleanupOldArticles(30); // 30 jours
    console.log(`[CLEANUP] Cleaned up ${count} articles\n`);
  } catch (error) {
    console.error('[CLEANUP] Error:', error);
  }
}

/**
 * Configuration et démarrage
 */
async function start() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     JAPAP News Scraper Service        ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Vérifier les variables d'environnement
  if (!process.env.DATABASE_URL) {
    console.error('[ERROR] DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const scrapingInterval = process.env.SCRAPING_INTERVAL || '0 */2 * * *'; // Toutes les 2 heures par défaut

  console.log(`[CONFIG] Scraping interval: ${scrapingInterval}`);
  console.log(`[CONFIG] Max articles per source: ${process.env.MAX_ARTICLES_PER_SOURCE || 20}`);
  console.log('');

  // Exécuter immédiatement au démarrage (optionnel)
  const runOnStart = process.env.RUN_ON_START !== 'false';
  if (runOnStart) {
    console.log('[INFO] Running initial scraping...\n');
    await runScraping();
  }

  // Planifier le scraping
  console.log(`[CRON] Scheduling scraping with pattern: ${scrapingInterval}\n`);
  cron.schedule(scrapingInterval, async () => {
    await runScraping();
  });

  // Planifier le nettoyage (tous les jours à 3h du matin)
  cron.schedule('0 3 * * *', async () => {
    await runCleanup();
  });

  console.log('[INFO] Scraper is running. Press Ctrl+C to stop.\n');
}

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  console.log('\n[INFO] Shutting down scraper...');
  await dbService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[INFO] Shutting down scraper...');
  await dbService.disconnect();
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('[ERROR] Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught exception:', error);
  process.exit(1);
});

// Démarrer le service
start().catch(error => {
  console.error('[ERROR] Failed to start scraper:', error);
  process.exit(1);
});
