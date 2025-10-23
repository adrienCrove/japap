import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '@/types/article';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.65; // 65% de la largeur d'écran

interface RelatedArticlesSectionProps {
  articles: Article[];
  sectionTitle?: string;
}

export default function RelatedArticlesSection({
  articles,
  sectionTitle = 'Articles similaires',
}: RelatedArticlesSectionProps) {
  const router = useRouter();

  const handleArticlePress = (articleId: string) => {
    router.push(`/article/${articleId}`);
  };

  const renderArticleCard = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => handleArticlePress(item.id)}
    >
      {/* Image miniature */}
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: item.heroImage }}
          style={styles.cardImage}
          contentFit="cover"
        />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Source avec logo */}
        <View style={styles.sourceRow}>
          {item.source.logo ? (
            <Image
              source={{ uri: item.source.logo }}
              style={styles.sourceLogo}
              contentFit="contain"
            />
          ) : (
            <View style={styles.sourceIconContainer}>
              <Ionicons name="newspaper-outline" size={14} color="#E94F23" />
            </View>
          )}
          <Text style={styles.sourceName}>{item.source.name}</Text>
        </View>

        {/* Titre de l'article */}
        <Text style={styles.cardTitle} numberOfLines={3}>
          {item.title}
        </Text>

        {/* Metadata (optionnel) */}
        <View style={styles.cardMetadata}>
          <Text style={styles.cardMetadataText}>{item.publishedAt}</Text>
          <Text style={styles.cardSeparator}>•</Text>
          <Text style={styles.cardMetadataText}>{item.readingTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <FlatList
        data={articles}
        renderItem={renderArticleCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: 'SUSE',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceLogo: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  sourceIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  sourceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E94F23',
    textTransform: 'uppercase',
    fontFamily: 'Lato',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'SUSE',
  },
  cardMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMetadataText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Lato',
  },
  cardSeparator: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 6,
  },
});
