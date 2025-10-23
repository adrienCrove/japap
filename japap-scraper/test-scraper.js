/**
 * Script de test rapide pour le scraper RSS
 * Usage: node test-scraper.js
 */

require('dotenv').config();
const RssScraper = require('./src/services/rssScraper');
const DatabaseService = require('./src/services/databaseService');

async function testScraper() {
  console.log('=== JAPAP News Scraper Test ===\n');

  const scraper = new RssScraper();
  const dbService = new DatabaseService();

  try {
    // Test 1: Vérifier la connexion DB
    console.log('Test 1: Database connection...');
    const stats = await dbService.getScrapingStats();
    if (stats) {
      console.log('✅ Database connected');
      console.log(`   - Total articles: ${stats.totalArticles}`);
      console.log(`   - Active sources: ${stats.activeSources}\n`);
    } else {
      console.log('❌ Database connection failed\n');
      process.exit(1);
    }

    // Test 2: Scraper une source unique
    console.log('Test 2: Scraping single source...');
    const source = scraper.activeSources[0];

    if (!source) {
      console.log('❌ No active sources configured\n');
      process.exit(1);
    }

    console.log(`   Source: ${source.name}`);
    console.log(`   URL: ${source.url}`);

    const result = await scraper.scrapeSource(source);

    if (result.success) {
      console.log(`✅ Scraped ${result.articles.length} articles`);

      if (result.articles.length > 0) {
        const firstArticle = result.articles[0];
        console.log('\n   Sample article:');
        console.log(`   - Title: ${firstArticle.title}`);
        console.log(`   - Category: ${firstArticle.primaryCategory}`);
        console.log(`   - Relevance: ${firstArticle.relevanceScore}`);
        console.log(`   - Priority: ${firstArticle.priority}`);
        console.log(`   - Published: ${firstArticle.publishedAt.toISOString()}\n`);
      }
    } else {
      console.log(`❌ Scraping failed: ${result.error}\n`);
    }

    // Test 3: Sauvegarder un article
    if (result.success && result.articles.length > 0) {
      console.log('Test 3: Saving article to database...');
      const article = result.articles[0];

      try {
        const saved = await dbService.saveArticle(article);
        console.log(`✅ Article saved with ID: ${saved.id}\n`);
      } catch (error) {
        console.log(`❌ Save failed: ${error.message}\n`);
      }
    }

    // Test 4: Récupérer les stats finales
    console.log('Test 4: Final stats...');
    const finalStats = await dbService.getScrapingStats();
    console.log(`   - Total articles: ${finalStats.totalArticles}`);
    console.log(`   - Recent articles (24h): ${finalStats.recentArticles}`);

    console.log('\n=== Test completed successfully ===\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dbService.disconnect();
  }
}

// Exécuter le test
testScraper();
