import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getAlertById, type Alert } from '@/services/api';
import { getOriginalImageUrl, getEnhancedImageUrl, hasEnhancedVersion } from '@/services/imageEnhancementApi';
import ImageComparator from './ImageComparator';
import MiniMapView from './map/MiniMapView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlertDetailViewProps {
  visible: boolean;
  alertId: string;
  onClose: () => void;
}

export default function AlertDetailView({ visible, alertId, onClose }: AlertDetailViewProps) {
  const { theme } = useTheme();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparatorVisible, setComparatorVisible] = useState(false);

  useEffect(() => {
    if (visible && alertId) {
      fetchAlertDetails();
    }
  }, [visible, alertId]);

  const fetchAlertDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAlertById(alertId);
      if (result.success && result.data) {
        setAlert(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (err: any) {
      console.error('Error fetching alert details:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenComparator = () => {
    setComparatorVisible(true);
  };

  const handleCloseComparator = () => {
    setComparatorVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.primaryText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Détails de l'alerte</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>Chargement...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={fetchAlertDetails}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alert Content */}
        {alert && !isLoading && !error && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category Badge */}
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.categoryText}>{alert.category}</Text>
              </View>
              <Text style={[styles.timestamp, { color: theme.colors.secondaryText }]}>
                {new Date(alert.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.primaryText }]}>
              {alert.displayTitle || alert.title}
            </Text>

            {/* Enhanced Image Section */}
            {hasEnhancedVersion(alert) && (
              <View style={styles.imageSection}>
                <View style={styles.imageSectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Photos</Text>
                  <View style={[styles.enhancedBadge, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                    <Text style={styles.enhancedBadgeText}>Image HD disponible</Text>
                  </View>
                </View>

                {/* Thumbnails */}
                <View style={styles.thumbnailsRow}>
                  <TouchableOpacity
                    style={styles.thumbnailContainer}
                    onPress={handleOpenComparator}
                  >
                    <Image
                      source={{ uri: getOriginalImageUrl(alert) || '' }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                    <View style={[styles.thumbnailLabel, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.thumbnailLabelText, { color: theme.colors.primaryText }]}>
                        Originale
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.thumbnailContainer}
                    onPress={handleOpenComparator}
                  >
                    <Image
                      source={{ uri: getEnhancedImageUrl(alert) || '' }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                    <View style={[styles.thumbnailLabel, styles.thumbnailLabelEnhanced, { backgroundColor: theme.colors.primary }]}>
                      <Ionicons name="sparkles" size={14} color="#fff" />
                      <Text style={styles.thumbnailLabelTextEnhanced}>HD</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Compare Button */}
                <TouchableOpacity
                  style={[styles.compareButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleOpenComparator}
                >
                  <Ionicons name="swap-horizontal" size={20} color="#fff" />
                  <Text style={styles.compareButtonText}>Comparer les versions</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Regular Image (if no enhancement) */}
            {!hasEnhancedVersion(alert) && alert.mediaUrl && (
              <View style={styles.imageSection}>
                <Image
                  source={{ uri: alert.mediaUrl }}
                  style={styles.regularImage}
                  contentFit="cover"
                />
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Description</Text>
              <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
                {alert.description}
              </Text>
            </View>

            {/* Location */}
            {alert.location && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Localisation</Text>
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color={theme.colors.primary} />
                  <Text style={[styles.locationText, { color: theme.colors.secondaryText }]}>
                    {alert.location.address || 'Adresse non disponible'}
                  </Text>
                </View>

                {/* Mini Map */}
                {alert.location.latitude && alert.location.longitude && (
                  <View style={styles.mapContainer}>
                    <MiniMapView
                      latitude={alert.location.latitude}
                      longitude={alert.location.longitude}
                      latitudeDelta={0.005}
                      longitudeDelta={0.005}
                      height={200}
                      borderRadius={12}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Status */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Statut</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        alert.status === 'active'
                          ? theme.colors.success + '20'
                          : alert.status === 'resolved'
                          ? theme.colors.primary + '20'
                          : theme.colors.error + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          alert.status === 'active'
                            ? theme.colors.success
                            : alert.status === 'resolved'
                            ? theme.colors.primary
                            : theme.colors.error,
                      },
                    ]}
                  >
                    {alert.status === 'active'
                      ? 'Active'
                      : alert.status === 'resolved'
                      ? 'Résolue'
                      : 'Expirée'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Image Comparator Modal */}
        {alert && hasEnhancedVersion(alert) && (
          <ImageComparator
            visible={comparatorVisible}
            originalImageUrl={getOriginalImageUrl(alert) || ''}
            enhancedImageUrl={getEnhancedImageUrl(alert) || ''}
            onClose={handleCloseComparator}
          />
        )}
      </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SUSE',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Lato',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  content: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  timestamp: {
    fontSize: 13,
    fontFamily: 'Lato',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 20,
    fontFamily: 'SUSE',
    lineHeight: 32,
  },
  imageSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  enhancedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  thumbnailContainer: {
    flex: 1,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  thumbnailLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  thumbnailLabelEnhanced: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  thumbnailLabelText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  thumbnailLabelTextEnhanced: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  regularImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'SUSE',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Lato',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 15,
    flex: 1,
    fontFamily: 'Lato',
  },
  mapContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
});
