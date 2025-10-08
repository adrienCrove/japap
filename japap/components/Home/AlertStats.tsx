import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AlertStatsProps {
  views: number;
  comments: number;
  confirmations: number;
  followers?: number;
  onCommentPress?: () => void;
  onSharePress?: () => void;
}

export default function AlertStats({
  views,
  comments,
  confirmations,
  followers,
  onCommentPress,
  onSharePress,
}: AlertStatsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatNumber(views)}</Text>
        </View>

        <TouchableOpacity style={styles.statItem} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.statText}>{comments}</Text>
        </TouchableOpacity>

        <View style={styles.statItem}>
          <Ionicons name="arrow-up-outline" size={16} color="#666" />
          <Text style={styles.statText}>{confirmations}</Text>
        </View>

        {followers !== undefined && (
          <View style={styles.statItem}>
            <Ionicons name="volume-high-outline" size={16} color="#666" />
            <Text style={styles.statText}>{formatNumber(followers)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={onSharePress}>
        <Ionicons name="share-outline" size={16} color="#000" />
        <Text style={styles.shareText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
