import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageComparatorProps {
  visible: boolean;
  originalImageUrl: string;
  enhancedImageUrl: string;
  onClose: () => void;
}

export default function ImageComparator({
  visible,
  originalImageUrl,
  enhancedImageUrl,
  onClose,
}: ImageComparatorProps) {
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<'enhanced' | 'original'>('enhanced');

  // Animation value for slider (0 = original, 1 = enhanced)
  const sliderPosition = useSharedValue(1); // Start with enhanced

  const toggleImage = () => {
    const newSelection = selectedImage === 'enhanced' ? 'original' : 'enhanced';
    setSelectedImage(newSelection);
    sliderPosition.value = withTiming(newSelection === 'enhanced' ? 1 : 0, { duration: 300 });
  };

  const selectOriginal = () => {
    setSelectedImage('original');
    sliderPosition.value = withTiming(0, { duration: 300 });
  };

  const selectEnhanced = () => {
    setSelectedImage('enhanced');
    sliderPosition.value = withTiming(1, { duration: 300 });
  };

  // Animated style for cross-fade effect
  const originalImageStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(sliderPosition.value, [0, 1], [1, 0]),
    };
  });

  const enhancedImageStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(sliderPosition.value, [0, 1], [0, 1]),
    };
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.primaryText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>
            Comparaison des images
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Thumbnails selector */}
        <View style={[styles.thumbnailsContainer, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.thumbnailWrapper,
              selectedImage === 'original' && styles.thumbnailWrapperActive,
              selectedImage === 'original' && { borderColor: theme.colors.primary }
            ]}
            onPress={selectOriginal}
          >
            <Image
              source={{ uri: originalImageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={[styles.thumbnailLabel, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.thumbnailLabelText, { color: theme.colors.primaryText }]}>
                Originale
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.thumbnailWrapper,
              selectedImage === 'enhanced' && styles.thumbnailWrapperActive,
              selectedImage === 'enhanced' && { borderColor: theme.colors.primary }
            ]}
            onPress={selectEnhanced}
          >
            <Image
              source={{ uri: enhancedImageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={[styles.thumbnailLabel, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="sparkles" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={[styles.thumbnailLabelText, { color: '#fff' }]}>
                HD
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Main image viewer */}
        <ScrollView
          style={styles.imageContainer}
          contentContainerStyle={styles.imageContentContainer}
          maximumZoomScale={3}
          minimumZoomScale={1}
          bouncesZoom
        >
          <View style={styles.imageStack}>
            {/* Original image (behind) */}
            <Animated.View style={[styles.imageWrapper, originalImageStyle]}>
              <Image
                source={{ uri: originalImageUrl }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Enhanced image (on top) */}
            <Animated.View style={[styles.imageWrapper, styles.imageOverlay, enhancedImageStyle]}>
              <Image
                source={{ uri: enhancedImageUrl }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </ScrollView>

        {/* Current selection indicator */}
        <View style={[styles.indicator, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.indicatorBadge, {
            backgroundColor: selectedImage === 'enhanced' ? theme.colors.primary : theme.colors.surfaceVariant
          }]}>
            {selectedImage === 'enhanced' && (
              <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.indicatorText, {
              color: selectedImage === 'enhanced' ? '#fff' : theme.colors.primaryText
            }]}>
              {selectedImage === 'enhanced' ? 'Image améliorée HD' : 'Image originale'}
            </Text>
          </View>
        </View>

        {/* Toggle button */}
        <View style={[styles.controls, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.colors.primary }]}
            onPress={toggleImage}
          >
            <Ionicons name="swap-horizontal" size={24} color="#fff" />
            <Text style={styles.toggleButtonText}>
              {selectedImage === 'enhanced' ? 'Voir originale' : 'Voir HD'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: theme.colors.secondaryText }]}>
            Pincez pour zoomer • Glissez pour déplacer
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  thumbnailsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  thumbnailWrapper: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailWrapperActive: {
    borderWidth: 3,
  },
  thumbnail: {
    width: 140,
    height: 140,
    borderRadius: 8,
  },
  thumbnailLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabelText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  imageContainer: {
    flex: 1,
  },
  imageContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStack: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    zIndex: 1,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  indicator: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  indicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    maxWidth: 300,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  hint: {
    fontSize: 12,
    marginTop: 12,
    fontFamily: 'Lato',
  },
});
