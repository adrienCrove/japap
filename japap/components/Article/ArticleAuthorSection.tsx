import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ArticleAuthor } from '@/types/article';

interface ArticleAuthorSectionProps {
  author: ArticleAuthor;
  readingTime: number; // en minutes
  views: number;
  sourcesCount: number; // Nombre de sources citées
}

export default function ArticleAuthorSection({
  author,
  readingTime,
  views,
  sourcesCount,
}: ArticleAuthorSectionProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatReadingTime = (minutes: number): string => {
    if (minutes < 1) {
      return '< 1 min';
    } else if (minutes === 1) {
      return '1 min';
    } else if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h${remainingMinutes}`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.authorRow}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: author.backgroundColor || '#5B8DEF' },
          ]}
        >
          {author.avatar ? (
            <Image source={{ uri: author.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitials}>{author.initials}</Text>
          )}
        </View>

        {/* Author Info */}
        <View style={styles.authorInfo}>
          <Text style={styles.authorLabel}>Rédigé par</Text>
          <Text style={styles.authorName}>{author.name}</Text>
        </View>
      </View>

      {/* Metadata Row */}
      <View style={styles.metadataRow}>
        {/* Reading Time */}
        <View style={styles.metadataItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.metadataText}>{formatReadingTime(readingTime)}</Text>
        </View>

        {/* Views */}
        <View style={styles.metadataItem}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.metadataText}>{formatNumber(views)}</Text>
        </View>

        {/* Sources Count */}
        {sourcesCount > 0 && (
          <View style={styles.sourceBadge}>
            <Ionicons name="documents-outline" size={14} color="#E94F23" />
            <Text style={styles.sourceBadgeText}>{sourcesCount} sources</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'SUSE',
  },
  authorInfo: {
    flex: 1,
  },
  authorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Lato',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'SUSE',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Lato',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E94F23',
    fontFamily: 'Lato',
  },
});
