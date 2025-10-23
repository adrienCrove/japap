import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdBannerProps {
  type: 'custom' | 'google';
  customImage?: string;
  customTitle?: string;
  customDescription?: string;
  adUnitId?: string; // Pour Google AdMob (à intégrer plus tard)
  onPress?: () => void;
}

export default function AdBanner({
  type,
  customImage,
  customTitle,
  customDescription,
  adUnitId,
  onPress,
}: AdBannerProps) {
  // Pour l'instant, on gère seulement les publicités personnalisées
  // L'intégration Google AdMob viendra plus tard
  if (type === 'google') {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Espace publicitaire Google Ads</Text>
          <Text style={styles.placeholderSubtext}>
            {adUnitId ? `ID: ${adUnitId}` : 'À intégrer'}
          </Text>
        </View>
      </View>
    );
  }

  // Publicité personnalisée
  if (type === 'custom' && customImage) {
    return (
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.customAdContainer}>
          <Image
            source={{ uri: customImage }}
            style={styles.customAdImage}
            contentFit="cover"
          />
          {(customTitle || customDescription) && (
            <View style={styles.customAdOverlay}>
              {customTitle && (
                <Text style={styles.customAdTitle}>{customTitle}</Text>
              )}
              {customDescription && (
                <Text style={styles.customAdDescription}>{customDescription}</Text>
              )}
            </View>
          )}
          {/* Label "Publicité" */}
          <View style={styles.adLabel}>
            <Text style={styles.adLabelText}>Publicité</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Fallback si pas de données
  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Publicité</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    marginVertical: 16,
  },
  customAdContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  customAdImage: {
    width: '100%',
    height: '100%',
  },
  customAdOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  customAdTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'SUSE',
  },
  customAdDescription: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Lato',
  },
  adLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adLabelText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Lato',
    textTransform: 'uppercase',
  },
  placeholderContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    fontFamily: 'Lato',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
    fontFamily: 'Lato',
  },
});
