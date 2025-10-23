import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AlertCard, { Alert } from '@/components/Home/AlertCard';
import AlertHeader, { ContentType } from '@/components/Home/AlertHeader';
import CategoryBadges from '@/components/News/CategoryBadges';
import { ENRICHED_ARTICLES } from '@/data/mockArticles';
import { Article } from '@/types/article';
import { useRouter } from 'expo-router';

// Mock data - À remplacer par des appels API réels
const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    username: 'Mendozacer25',
    title: 'Man Armed With Airsoft Gun Fatally Shot by Police',
    description: 'Police have cordoned off an area following reports of a man with an assault rifle in a vehicle.',
    location: 'Los Angeles, CA',
    timeAgo: '2h ago',
    images: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
      'https://picsum.photos/400/300?random=3',
    ],
    views: 345000,
    comments: 24,
    confirmations: 13,
    followers: 8228,
    category: 'Police Activity',
  },
  {
    id: '2',
    username: 'SafetyFirst',
    title: 'Major Traffic Accident on Highway 101',
    description: 'Multiple vehicles involved in collision. Emergency services on scene. Expect delays.',
    location: 'San Francisco, CA',
    timeAgo: '45min ago',
    images: [
      'https://picsum.photos/400/300?random=4',
      'https://picsum.photos/400/300?random=5',
    ],
    views: 52000,
    comments: 12,
    confirmations: 8,
    followers: 4521,
    category: 'Traffic',
  },
  {
    id: '3',
    username: 'CommunityWatch',
    title: 'Fire Breaks Out in Downtown Building',
    description: 'Firefighters responding to a 3-alarm fire. Residents evacuated safely. No injuries reported.',
    location: 'Oakland, CA',
    timeAgo: '1h ago',
    images: [
      'https://picsum.photos/400/300?random=6',
    ],
    views: 128000,
    comments: 45,
    confirmations: 32,
    followers: 12500,
    category: 'Fire',
  },
];

// Helper function to convert Article to Alert format for display in AlertCard
function articleToAlert(article: Article): Alert {
  return {
    id: article.id,
    username: article.source.name,
    userAvatar: article.source.logo,
    title: article.title,
    description: article.content.substring(0, 200) + '...', // Truncate for preview
    location: 'Cameroun', // Simplified, could be extracted from article data
    timeAgo: article.publishedAt,
    images: [article.heroImage],
    views: article.views,
    comments: article.comments || 0,
    confirmations: article.likes || 0,
    followers: undefined,
    category: article.category,
  };
}

export default function NewsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('nationwide');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [contentType, setContentType] = useState<ContentType>('alerts');
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    // Simuler un appel API
    // TODO: Remplacer par de vrais appels API séparés pour alerts et news
    setTimeout(() => {
      if (contentType === 'alerts') {
        setAlerts(MOCK_ALERTS);
      } else {
        // Filtrer les actualités par catégorie si une catégorie est sélectionnée
        let articles = ENRICHED_ARTICLES;
        if (selectedNewsCategory) {
          articles = ENRICHED_ARTICLES.filter((article: Article) => article.category === selectedNewsCategory);
        }
        // Convertir les articles en format Alert pour l'affichage
        const newsData = articles.map(articleToAlert);
        setAlerts(newsData);
      }
      setLoading(false);
    }, 1000);
  }, [contentType, selectedNewsCategory]);

  // Charger les alertes initiales
  useEffect(() => {
    loadAlerts();
  }, [scope, timeFilter, loadAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simuler un appel API pour rafraîchir
    // TODO: Remplacer par de vrais appels API séparés pour alerts et news
    setTimeout(() => {
      if (contentType === 'alerts') {
        setAlerts(MOCK_ALERTS);
      } else {
        // Filtrer les actualités par catégorie si une catégorie est sélectionnée
        let articles = ENRICHED_ARTICLES;
        if (selectedNewsCategory) {
          articles = ENRICHED_ARTICLES.filter((article: Article) => article.category === selectedNewsCategory);
        }
        // Convertir les articles en format Alert pour l'affichage
        const newsData = articles.map(articleToAlert);
        setAlerts(newsData);
      }
      setRefreshing(false);
    }, 500);
  };

  const handleLoadMore = () => {
    // Charger plus d'alertes (infinite scroll)
    console.log('Load more alerts');
  };

  const handleAlertPress = (alert: Alert) => {
    // Si c'est un article de news, naviguer vers la page de détail
    if (contentType === 'news') {
      router.push(`/article/${alert.id}` as any);
    } else {
      // Pour les alertes, garder le comportement actuel (navigation future)
      console.log('Alert pressed:', alert.id);
    }
  };

  const handleCommentPress = (alert: Alert) => {
    // Ouvrir la section commentaires
    console.log('Comments pressed for:', alert.id);
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertCard
      alert={item}
      onPress={() => handleAlertPress(item)}
      onCommentPress={() => handleCommentPress(item)}
    />
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FF0000" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerContainer}>
        <AlertHeader
          scope={scope}
          timeFilter={timeFilter}
          contentType={contentType}
          onScopeChange={setScope}
          onTimeFilterChange={setTimeFilter}
          onContentTypeChange={setContentType}
        />
      </View>

      {/* Category Badges - visible seulement sur l'onglet Actualités */}
      {contentType === 'news' && (
        <CategoryBadges
          selectedCategory={selectedNewsCategory}
          onCategoryChange={setSelectedNewsCategory}
          visible={true}
        />
      )}

      {loading && alerts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF0000"
              colors={['#FF0000']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 30,
  },
  listContent: {
    paddingTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});