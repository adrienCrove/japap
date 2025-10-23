import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import ImageCarousel from './ImageCarousel';
import ImageViewerModal from './ImageViewerModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Alert {
  id: string;
  username: string;
  userAvatar?: string;
  title: string;
  description: string;
  location: string;
  timeAgo: string;
  images: string[];
  views: number;
  comments: number;
  confirmations: number;
  followers?: number;
  category?: string;
}

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
  onCommentPress?: () => void;
}

export default function AlertCard({ alert, onPress, onCommentPress }: AlertCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${alert.title}\n${alert.location}\n${alert.description}`,
        title: alert.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      {/* Header - User Info at the TOP like social media */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {alert.userAvatar ? (
              <Image source={{ uri: alert.userAvatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-circle" size={40} color="#666" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{alert.username}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.timeAgo}>{alert.timeAgo}</Text>
              <Text style={styles.separator}>•</Text>
              <Ionicons name="location" size={12} color="#666" />
              <Text style={styles.location}>{alert.location}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Title & Description - Before image like social posts */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {alert.description}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Image Carousel - Prominent and centered */}
      <View style={styles.imageContainer}>
        <ImageCarousel
          images={alert.images}
          height={400}
          onImagePress={handleImagePress}
        />

        {/* Image counter badge */}
        {alert.images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images" size={14} color="#fff" />
            <Text style={styles.imageCountText}>{alert.images.length}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons - Like Instagram/Facebook */}
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={26}
            color={isFavorite ? '#FF0000' : '#000'}
          />
          <Text style={[styles.actionText, isFavorite && styles.actionTextActive]}>
            {formatNumber(alert.confirmations)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={24} color="#000" />
          <Text style={styles.actionText}>{formatNumber(alert.comments)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="arrow-redo-outline" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.actionSpacer} />

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={24} color="#666" />
          <Text style={styles.actionTextSecondary}>{formatNumber(alert.views)}</Text>
        </TouchableOpacity>
      </View>

      {/* Category badge if available */}
      {alert.category && (
        <View style={styles.categoryContainer}>
          <View style={styles.categoryBadge}>
            <Ionicons name="pricetag" size={12} color="#FF0000" />
            <Text style={styles.categoryText}>{alert.category}</Text>
          </View>
        </View>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageViewer}
        images={alert.images}
        initialIndex={selectedImageIndex}
        title={alert.title}
        description={alert.description}
        username={alert.username}
        userAvatar={alert.userAvatar}
        location={alert.location}
        timeAgo={alert.timeAgo}
        onClose={() => setShowImageViewer(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
  },
  // Header with user info at top
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  moreButton: {
    padding: 4,
  },
  // Text content before image
  textContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Image container
  imageContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    marginLeft: 0,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Actions bar (like, comment, share)
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  actionTextActive: {
    color: '#FF0000',
  },
  actionTextSecondary: {
    fontSize: 13,
    color: '#666',
  },
  actionSpacer: {
    flex: 1,
  },
  // Category badge
  categoryContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF0000',
  },
});
