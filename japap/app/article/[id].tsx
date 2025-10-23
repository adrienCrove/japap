import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ArticleHeroHeader from '@/components/Article/ArticleHeroHeader';
import ArticleAuthorSection from '@/components/Article/ArticleAuthorSection';
import RelatedArticlesSection from '@/components/Article/RelatedArticlesSection';
import AdBanner from '@/components/Ads/AdBanner';
import { Article } from '@/types/article';
import { ENRICHED_ARTICLES } from '@/data/mockArticles';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    // Simuler un appel API
    // TODO: Remplacer par un vrai appel API
    setTimeout(() => {
      const foundArticle = ENRICHED_ARTICLES.find((a) => a.id === id);
      setArticle(foundArticle || null);
      setLoading(false);
    }, 300);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E94F23" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Hero Image with Header Overlay */}
        <ArticleHeroHeader
          heroImage={article.heroImage}
          title={article.title}
          isBookmarked={article.isBookmarked}
        />

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Article Content */}
          <Text style={styles.content}>{article.content}</Text>

          {/* Author Section */}
          <ArticleAuthorSection
            author={article.author}
            readingTime={article.readingTime}
            views={article.views}
            sourcesCount={article.sources.length}
          />

          {/* Related Articles */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <RelatedArticlesSection
              articles={article.relatedArticles}
              sectionTitle={article.title}
            />
          )}

          {/* Ad Banner */}
          <AdBanner
            type="custom"
            customImage="https://via.placeholder.com/800x400/FF9500/FFFFFF?text=Sepelass+100%25+Bonus"
            customTitle="Sepelass 100% Bonus"
            customDescription="À chaque recharge"
          />

          {/* Repeated Content (optionnel selon le mockup) */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.content}>{article.content}</Text>
          </View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Lato',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    lineHeight: 32,
    marginTop: 20,
    marginBottom: 16,
    fontFamily: 'SUSE',
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: 'Lato',
  },
  bottomSpacer: {
    height: 40,
  },
});
