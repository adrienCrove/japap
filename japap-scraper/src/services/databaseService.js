const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DatabaseService {
  /**
   * Sauvegarde un article dans la base de données
   * @param {Object} article - Article à sauvegarder
   * @returns {Promise<Object>} Article sauvegardé
   */
  async saveArticle(article) {
    try {
      // Vérifier si l'article existe déjà (par URL source ou externalId)
      const existing = await this.findExistingArticle(article.sourceUrl, article.externalId);

      if (existing) {
        // Mettre à jour si l'article existe déjà
        return await this.updateArticle(existing.id, article);
      }

      // Créer un nouvel article
      const saved = await prisma.newsArticle.create({
        data: {
          title: article.title,
          summary: article.summary,
          content: article.content,
          sourceUrl: article.sourceUrl,
          sourceName: article.sourceName,
          categories: article.categories || [],
          primaryCategory: article.primaryCategory,
          location: article.location || null,
          publishedAt: article.publishedAt,
          relevanceScore: article.relevanceScore,
          priority: article.priority || 'medium',
          imageUrl: article.imageUrl,
          images: article.images || null,
          relatedAlertIds: [],
          author: article.author,
          tags: [],
          language: article.language || 'fr',
          slug: article.slug,
          externalId: article.externalId,
          metadata: article.metadata || {}
        }
      });

      console.log(`[DB] Article saved: ${saved.title}`);
      return saved;

    } catch (error) {
      console.error('[DB] Error saving article:', error.message);
      throw error;
    }
  }

  /**
   * Recherche un article existant
   */
  async findExistingArticle(sourceUrl, externalId) {
    const conditions = [];

    if (sourceUrl) {
      conditions.push({ sourceUrl });
    }

    if (externalId) {
      conditions.push({ externalId });
    }

    if (conditions.length === 0) {
      return null;
    }

    return await prisma.newsArticle.findFirst({
      where: {
        OR: conditions
      }
    });
  }

  /**
   * Met à jour un article existant
   */
  async updateArticle(id, article) {
    try {
      const updated = await prisma.newsArticle.update({
        where: { id },
        data: {
          title: article.title,
          summary: article.summary,
          content: article.content,
          categories: article.categories || [],
          primaryCategory: article.primaryCategory,
          relevanceScore: article.relevanceScore,
          priority: article.priority,
          imageUrl: article.imageUrl,
          images: article.images,
          author: article.author,
          updatedAt: new Date()
        }
      });

      console.log(`[DB] Article updated: ${updated.title}`);
      return updated;

    } catch (error) {
      console.error('[DB] Error updating article:', error.message);
      throw error;
    }
  }

  /**
   * Sauvegarde plusieurs articles
   * @param {Array} articles - Liste d'articles
   * @returns {Promise<Object>} Résultats
   */
  async saveArticles(articles) {
    const results = {
      saved: 0,
      updated: 0,
      errors: 0,
      errorMessages: []
    };

    for (const article of articles) {
      try {
        const existing = await this.findExistingArticle(article.sourceUrl, article.externalId);

        if (existing) {
          await this.updateArticle(existing.id, article);
          results.updated++;
        } else {
          await this.saveArticle(article);
          results.saved++;
        }

      } catch (error) {
        results.errors++;
        results.errorMessages.push({
          title: article.title,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Met à jour les stats d'une source
   */
  async updateSourceStats(sourceName, success, error = null) {
    try {
      // Chercher la source
      let source = await prisma.newsSource.findUnique({
        where: { name: sourceName }
      });

      const now = new Date();

      if (!source) {
        // Créer la source si elle n'existe pas
        source = await prisma.newsSource.create({
          data: {
            name: sourceName,
            url: '', // À remplir manuellement ou depuis config
            type: 'rss',
            category: [],
            isActive: true,
            lastScraped: now,
            lastSuccess: success ? now : null,
            lastError: error,
            articleCount: 0,
            errorCount: error ? 1 : 0
          }
        });
      } else {
        // Mettre à jour la source existante
        const updateData = {
          lastScraped: now,
          errorCount: error ? source.errorCount + 1 : source.errorCount
        };

        if (success) {
          updateData.lastSuccess = now;
          updateData.lastError = null;
        } else if (error) {
          updateData.lastError = error;
        }

        source = await prisma.newsSource.update({
          where: { id: source.id },
          data: updateData
        });
      }

      return source;

    } catch (error) {
      console.error('[DB] Error updating source stats:', error.message);
    }
  }

  /**
   * Incrémente le compteur d'articles d'une source
   */
  async incrementSourceArticleCount(sourceName, count) {
    try {
      const source = await prisma.newsSource.findUnique({
        where: { name: sourceName }
      });

      if (source) {
        await prisma.newsSource.update({
          where: { id: source.id },
          data: {
            articleCount: {
              increment: count
            }
          }
        });
      }
    } catch (error) {
      console.error('[DB] Error incrementing article count:', error.message);
    }
  }

  /**
   * Supprime les vieux articles (cleanup)
   */
  async cleanupOldArticles(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.newsArticle.updateMany({
        where: {
          publishedAt: {
            lt: cutoffDate
          },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      console.log(`[DB] Cleaned up ${result.count} old articles`);
      return result.count;

    } catch (error) {
      console.error('[DB] Error cleaning up old articles:', error.message);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de scraping
   */
  async getScrapingStats() {
    try {
      const [totalArticles, activeSources, recentArticles] = await Promise.all([
        prisma.newsArticle.count({
          where: { isActive: true }
        }),
        prisma.newsSource.count({
          where: { isActive: true }
        }),
        prisma.newsArticle.count({
          where: {
            isActive: true,
            scrapedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        totalArticles,
        activeSources,
        recentArticles
      };

    } catch (error) {
      console.error('[DB] Error fetching stats:', error.message);
      return null;
    }
  }

  /**
   * Ferme la connexion à la base de données
   */
  async disconnect() {
    await prisma.$disconnect();
  }
}

module.exports = DatabaseService;
