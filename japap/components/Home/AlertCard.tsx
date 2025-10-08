import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import ImageCarousel from './ImageCarousel';
import AlertStats from './AlertStats';

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

  return (
    <View style={styles.container}>
      {/* Image Carousel */}
      <View style={styles.imageContainer}>
        <ImageCarousel images={alert.images} height={300} />

        {/* Favorite Button Overlay */}
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? '#FF0000' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.content}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {alert.userAvatar ? (
                <Image source={{ uri: alert.userAvatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-circle-outline" size={24} color="#666" />
              )}
            </View>
            <Text style={styles.username}>{alert.username}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{alert.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <Text style={styles.timeAgo}>{alert.timeAgo}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.location}>{alert.location}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={3}>
            {alert.description}
          </Text>
        </View>

        {/* Stats */}
        <AlertStats
          views={alert.views}
          comments={alert.comments}
          confirmations={alert.confirmations}
          followers={alert.followers}
          onCommentPress={onCommentPress}
          onSharePress={handleShare}
        />

        {/* Additional Images Preview */}
        {alert.images.length > 1 && (
          <View style={styles.additionalImagesContainer}>
            <View style={styles.additionalImages}>
              {alert.images.slice(1, 4).map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  imageContainer: {
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 24,
    height: 24,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    lineHeight: 24,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeAgo: {
    fontSize: 13,
    color: '#666',
  },
  separator: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 6,
  },
  location: {
    fontSize: 13,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  additionalImagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  additionalImages: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailImage: {
    width: 80,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
});
