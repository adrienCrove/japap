import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.4; // 40% de la hauteur d'écran

interface ArticleHeroHeaderProps {
  heroImage: string;
  title: string;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
}

export default function ArticleHeroHeader({
  heroImage,
  title,
  onBookmarkPress,
  isBookmarked = false,
}: ArticleHeroHeaderProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleBack = () => {
    router.back();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmarkPress?.();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: title,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <Image
        source={{ uri: heroImage }}
        style={styles.heroImage}
        contentFit="cover"
      />

      {/* Gradient overlay for better contrast */}
      <View style={styles.gradientOverlay} />

      {/* Header Overlay with Actions */}
      <SafeAreaView edges={['top']} style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          {/* Right Actions */}
          <View style={styles.rightActions}>
            {/* Bookmark Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBookmark}
              activeOpacity={0.8}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={bookmarked ? '#E94F23' : '#000'}
              />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Léger assombrissement pour contraste
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
