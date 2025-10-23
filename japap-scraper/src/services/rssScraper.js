const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { sources, relevanceKeywords } = require('../config/sources');
const { calculateRelevanceScore, extractMainImage, categorizeArticle, generateSlug, isArticleRelevant } = require('../utils/newsUtils');

const parser = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'JAPAP News Aggregator/1.0'
  }
});

class RssScraper {
  constructor() {
    this.activeSources = sources.filter(s => s.enabled && s.type === 'rss');
  }

  /**
   * Scrape une source RSS spécifique
   * @param {Object} source - Configuration de la source
   * @returns {Promise<Array>} Articles extraits
   */
  async scrapeSource(source) {
    console.log(`[RSS] Scraping ${source.name}...`);

    try {
      const feed = await parser.parseURL(source.url);
      const articles = [];

      const maxArticles = parseInt(process.env.MAX_ARTICLES_PER_SOURCE) || 20;
      const itemsToProcess = feed.items.slice(0, maxArticles);

      for (const item of itemsToProcess) {
        try {
          const article = await this.parseArticle(item, source);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          console.error(`[RSS] Error parsing article from ${source.name}:`, error.message);
        }
      }

      console.log(`[RSS] Scraped ${articles.length} articles from ${source.name}`);
      return {
        success: true,
        source: source.name,
        articles,
        error: null
      };

    } catch (error) {
      console.error(`[RSS] Failed to scrape ${source.name}:`, error.message);
      return {
        success: false,
        source: source.name,
        articles: [],
        error: error.message
      };
    }
  }

  /**
   * Parse un item RSS en article structuré
   * @param {Object} item - Item du flux RSS
   * @param {Object} source - Configuration de la source
   * @returns {Object} Article formaté
   */
  async parseArticle(item, source) {
    // Extraction de base
    const title = item.title?.trim();
    const content = item.content || item.contentSnippet || item.description || '';
    const summary = this.extractSummary(item);

    if (!title || !content) {
      return null;
    }

    // Extraction de l'image principale
    const imageUrl = this.extractImageUrl(item);

    // Extraction des images supplémentaires du contenu HTML
    const additionalImages = this.extractImages(content);

    // Catégorisation
    const { categories, primaryCategory } = categorizeArticle(title, content, source.category);

    // Filtrage : Rejeter articles non pertinents (sport, people, etc.)
    if (!isArticleRelevant(title, content, categories)) {
      console.log(`[RSS] Article rejeté (blacklist): ${title.substring(0, 50)}...`);
      return null;
    }

    // Calcul du score de pertinence
    const relevanceScore = calculateRelevanceScore(title, content, categories);

    // Déterminer la priorité
    const priority = this.determinePriority(relevanceScore, title, content);

    // Extraction de l'auteur
    const author = item.creator || item.author || null;

    // Date de publication
    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

    // Génération du slug
    const slug = generateSlug(title);

    // ID externe (si disponible)
    const externalId = item.guid || item.id || null;

    return {
      title,
      summary,
      content: this.cleanContent(content),
      sourceUrl: item.link,
      sourceName: source.name,
      categories,
      primaryCategory,
      location: source.location || null,
      publishedAt,
      relevanceScore,
      priority,
      imageUrl,
      images: additionalImages.length > 0 ? additionalImages : null,
      author,
      language: this.detectLanguage(title, content),
      slug,
      externalId,
      metadata: {
        scraperVersion: '1.0.0',
        feedTitle: item.title,
        rawCategories: item.categories || []
      }
    };
  }

  /**
   * Extrait le résumé de l'article
   */
  extractSummary(item) {
    let summary = item.contentSnippet || item.description || '';

    // Nettoyer le HTML
    summary = summary.replace(/<[^>]*>/g, '');

    // Limiter à 300 caractères
    if (summary.length > 300) {
      summary = summary.substring(0, 297) + '...';
    }

    return summary.trim() || null;
  }

  /**
   * Extrait l'URL de l'image principale
   */
  extractImageUrl(item) {
    // 1. Média enclosure
    if (item.enclosure && item.enclosure.type?.startsWith('image/')) {
      return item.enclosure.url;
    }

    // 2. Media RSS
    if (item['media:content']) {
      const media = Array.isArray(item['media:content'])
        ? item['media:content'][0]
        : item['media:content'];
      if (media && media.$ && media.$.url) {
        return media.$.url;
      }
    }

    // 3. Media thumbnail
    if (item['media:thumbnail']) {
      const thumb = Array.isArray(item['media:thumbnail'])
        ? item['media:thumbnail'][0]
        : item['media:thumbnail'];
      if (thumb && thumb.$ && thumb.$.url) {
        return thumb.$.url;
      }
    }

    // 4. Extraire de content:encoded ou description
    const content = item['content:encoded'] || item.content || item.description || '';
    const $ = cheerio.load(content);
    const firstImg = $('img').first();
    if (firstImg.length) {
      return firstImg.attr('src');
    }

    return null;
  }

  /**
   * Extrait toutes les images du contenu HTML
   */
  extractImages(content) {
    const images = [];
    const $ = cheerio.load(content);

    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && src.startsWith('http')) {
        images.push(src);
      }
    });

    // Limiter à 5 images max
    return images.slice(0, 5);
  }

  /**
   * Nettoie le contenu HTML
   */
  cleanContent(content) {
    // Supprimer les balises HTML mais garder les sauts de ligne
    const $ = cheerio.load(content);

    // Supprimer scripts et styles
    $('script, style').remove();

    // Récupérer le texte
    let text = $.text();

    // Nettoyer les espaces multiples
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Détermine la priorité de l'article
   */
  determinePriority(relevanceScore, title, content) {
    const text = `${title} ${content}`.toLowerCase();

    // High priority keywords
    const highKeywords = relevanceKeywords.high.some(kw => text.includes(kw.toLowerCase()));
    if (highKeywords || relevanceScore >= 0.8) {
      return 'high';
    }

    // Medium priority keywords
    const mediumKeywords = relevanceKeywords.medium.some(kw => text.includes(kw.toLowerCase()));
    if (mediumKeywords || relevanceScore >= 0.5) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Détecte la langue de l'article
   */
  detectLanguage(title, content) {
    const text = `${title} ${content}`.toLowerCase();

    // Mots français communs
    const frenchWords = ['le', 'la', 'les', 'de', 'et', 'à', 'un', 'une', 'dans'];
    const frenchCount = frenchWords.filter(word => text.includes(` ${word} `)).length;

    // Mots anglais communs
    const englishWords = ['the', 'and', 'of', 'to', 'in', 'a', 'is', 'for'];
    const englishCount = englishWords.filter(word => text.includes(` ${word} `)).length;

    return frenchCount >= englishCount ? 'fr' : 'en';
  }

  /**
   * Scrape toutes les sources actives
   * @returns {Promise<Array>} Résultats de tous les scrapes
   */
  async scrapeAll() {
    console.log(`[RSS] Starting scraping of ${this.activeSources.length} sources...`);

    const results = [];

    for (const source of this.activeSources) {
      const result = await this.scrapeSource(source);
      results.push(result);

      // Délai entre les sources pour éviter d'être bloqué
      await this.delay(2000);
    }

    const totalArticles = results.reduce((sum, r) => sum + r.articles.length, 0);
    const successCount = results.filter(r => r.success).length;

    console.log(`[RSS] Scraping completed: ${successCount}/${this.activeSources.length} sources, ${totalArticles} articles`);

    return results;
  }

  /**
   * Délai utilitaire
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RssScraper;
