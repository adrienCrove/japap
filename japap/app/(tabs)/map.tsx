import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getAllAlerts } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import NativeMapView from '@/components/map/NativeMapView';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Type local pour la carte (adapté de l'API)
interface MapAlert {
  id: string;
  ref_alert_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'resolved' | 'rejected';
  description: string;
  title: string;
  displayTitle: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: string;
}

// Catégories d'incidents
const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: 'apps' as const, color: '#666' },
  { id: 'accident', label: 'Accidents', icon: 'car' as const, color: '#FF6B35' },
  { id: 'aggression', label: 'Agressions', icon: 'alert-circle' as const, color: '#DC2626' },
  { id: 'inondation', label: 'Inondations', icon: 'water' as const, color: '#0284C7' },
  { id: 'manifestation', label: 'Manifestations', icon: 'people' as const, color: '#7C3AED' },
  { id: 'embouteillage', label: 'Embouteillages', icon: 'time' as const, color: '#EAB308' },
  { id: 'panne', label: 'Pannes', icon: 'flash-off' as const, color: '#6B7280' },
  { id: 'disparition', label: 'Disparitions', icon: 'search' as const, color: '#EA580C' },
];

// Fonction pour transformer les alertes de l'API en MapAlert
const transformApiAlert = (apiAlert: any): MapAlert | null => {
  // Les coordonnées peuvent être soit un tableau [lat, lng] soit un objet {lat, lng}
  let lat: number | null = null;
  let lng: number | null = null;

  if (Array.isArray(apiAlert.location?.coordinates)) {
    // Format tableau: [lat, lng]
    lat = apiAlert.location.coordinates[0];
    lng = apiAlert.location.coordinates[1];
  } else if (apiAlert.location?.coordinates?.lat && apiAlert.location?.coordinates?.lng) {
    // Format objet: {lat, lng}
    lat = apiAlert.location.coordinates.lat;
    lng = apiAlert.location.coordinates.lng;
  }

  // Vérifier que les coordonnées sont valides
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.warn('Alerte sans coordonnées valides:', apiAlert.id, { lat, lng });
    return null;
  }

  return {
    id: apiAlert.id,
    ref_alert_id: apiAlert.ref_alert_id,
    category: apiAlert.category,
    severity: apiAlert.severity,
    status: apiAlert.status,
    title: apiAlert.title,
    displayTitle: apiAlert.displayTitle,
    description: apiAlert.description,
    location: {
      lat,
      lng,
      address: apiAlert.location.address,
    },
    createdAt: apiAlert.createdAt,
  };
};

// Villes du Cameroun
const CITIES = [
  { id: 'all', name: 'Toutes les villes' },
  { id: 'douala', name: 'Douala' },
  { id: 'yaounde', name: 'Yaoundé' },
  { id: 'bafoussam', name: 'Bafoussam' },
  { id: 'garoua', name: 'Garoua' },
  { id: 'maroua', name: 'Maroua' },
  { id: 'bamenda', name: 'Bamenda' },
  { id: 'ngaoundere', name: 'Ngaoundéré' },
];

export default function MapScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [selectedCity, setSelectedCity] = useState('all');
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  // Calculer les snapPoints : 25%, 50% et 80% de la hauteur d'écran
  // Mais en laissant toujours 20% visible en haut
  const snapPoints = useMemo(() => [
    '25%',
    '50%',
    '80%'
  ], []);

  // Charger les alertes depuis l'API
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllAlerts({
        status: 'active',
        limit: 100,
      });

      console.log('📡 Réponse API complète:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log('✅ Nombre d\'alertes reçues:', response.data.alerts.length);

        // Log de la première alerte pour voir sa structure
        if (response.data.alerts.length > 0) {
          console.log('📍 Première alerte:', JSON.stringify(response.data.alerts[0], null, 2));
        }

        const transformedAlerts = response.data.alerts
          .map(transformApiAlert)
          .filter((alert): alert is MapAlert => alert !== null);

        console.log('✅ Alertes transformées valides:', transformedAlerts.length);
        console.log('📍 Première alerte transformée:', transformedAlerts[0]);

        setAlerts(transformedAlerts);
      } else {
        console.log('❌ Erreur API:', response.error);
        showToast(response.error || 'Erreur lors du chargement des alertes');
      }
    } catch (error: any) {
      console.log('❌ Exception:', error);
      showToast(error.message || 'Erreur lors du chargement des alertes');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Filtrer les alertes par catégorie
  const filteredAlerts = useMemo(() => {
    if (selectedCategory === 'all') return alerts;
    return alerts.filter(alert => alert.category === selectedCategory);
  }, [selectedCategory, alerts]);

  // Obtenir la couleur du marqueur selon la catégorie
  const getMarkerColor = (category: string): string => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.color || '#666';
  };

  // Obtenir l'icône selon la catégorie
  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || 'alert-circle';
  };

  // Gérer le clic sur une catégorie
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryMenu(false);
  }, []);

  // Gérer la sélection d'une alerte
  const handleAlertSelect = useCallback((alert: MapAlert) => {
    setSelectedAlert(alert);
    bottomSheetRef.current?.snapToIndex(1); // Ouvrir le bottom sheet au niveau moyen
  }, []);

  // Calculer le temps écoulé depuis la création de l'alerte
  const getTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      return `${diffInDays}d`;
    }
  };

  // Calculer la distance (pour l'instant, retourne une valeur fixe - à implémenter avec la vraie position)
  const getDistance = (alert: MapAlert): string => {
    // TODO: Implémenter le calcul de distance réel avec la position de l'utilisateur
    return '2.5 km';
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return { label: 'Résolue', icon: 'checkmark-circle', color: '#059669' };
      case 'active':
        return { label: 'Active', icon: 'alert-circle', color: '#EAB308' };
      case 'pending':
        return { label: 'En attente', icon: 'time', color: '#6B7280' };
      case 'rejected':
        return { label: 'Rejetée', icon: 'close-circle', color: '#DC2626' };
      default:
        return { label: 'Inconnue', icon: 'help-circle', color: '#9CA3AF' };
    }
  };

  // Rendu d'un item d'alerte dans le bottom sheet
  const renderAlertItem = ({ item }: { item: MapAlert }) => {
    const isSelected = selectedAlert?.id === item.id;
    const statusBadge = getStatusBadge(item.status);
    const timeAgo = getTimeAgo(item.createdAt);
    const distance = getDistance(item);

    return (
      <TouchableOpacity
        style={[styles.alertCard, isSelected && styles.alertCardSelected]}
        onPress={() => handleAlertSelect(item)}
        activeOpacity={0.7}
      >
        {/* Header: Icône + Titre + Badge Statut */}
        <View style={styles.alertCardHeader}>
          <View style={[styles.alertCardIcon, { backgroundColor: getMarkerColor(item.category) }]}>
            <Ionicons name={getCategoryIcon(item.category)} size={20} color="#fff" />
          </View>

          <View style={styles.alertCardTitleContainer}>
            <Text style={styles.alertCardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.alertCardMeta}>
              <Text style={styles.alertCardMetaText}>
                {distance} · {timeAgo}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '15' }]}>
            <Ionicons name={statusBadge.icon as any} size={12} color={statusBadge.color} />
            <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.alertCardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Actions */}
        <View style={styles.alertCardActions}>
          <TouchableOpacity style={styles.commentInput} activeOpacity={0.9}>
            <Text style={styles.commentInputPlaceholder}>Écrire un commentaire...</Text>
          </TouchableOpacity>

          <View style={styles.alertCardIconActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#EAB308';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />

        {/* Carte Native */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E94F23" />
            <Text style={styles.loadingText}>Chargement de la carte...</Text>
          </View>
        ) : (
          <NativeMapView
            alerts={filteredAlerts}
            selectedAlert={selectedAlert}
            onAlertSelect={handleAlertSelect}
            center={[4.0511, 9.7679]}
            zoom={10}
          />
        )}

        {/* Bouton de filtre par catégorie (en haut à gauche) */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryMenu(!showCategoryMenu)}
            activeOpacity={0.9}
          >
            <View style={styles.categoryButtonContent}>
              <Ionicons name={selectedCategoryData?.icon || 'apps'} size={20} color="#000" />
              <Text style={styles.categoryButtonText}>{selectedCategoryData?.label}</Text>
              <Ionicons name={showCategoryMenu ? 'chevron-up' : 'chevron-down'} size={20} color="#000" />
            </View>
          </TouchableOpacity>

          {/* Menu déroulant des catégories */}
          {showCategoryMenu && (
            <View style={styles.categoryMenu}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryMenuItem,
                    selectedCategory === category.id && styles.categoryMenuItemSelected
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={category.icon} size={20} color={category.color} />
                  <Text style={styles.categoryMenuText}>{category.label}</Text>
                  {selectedCategory === category.id && (
                    <Ionicons name="checkmark" size={20} color="#E94F23" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bouton de recentrage (en haut à droite) */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={fetchAlerts}
        >
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>

        {/* Bottom Sheet avec la liste des incidents */}
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          enableContentPanningGesture={true}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          maxDynamicContentSize={SCREEN_HEIGHT * 0.80}
        >
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetTitleRow}>
              <Text style={styles.bottomSheetTitle}>Dans cette zone</Text>
            </View>

            <View style={styles.bottomSheetFiltersRow}>
              {/* Badge nombre d'incidents */}
              <View style={styles.countBadge}>
                <Ionicons name="alert-circle-outline" size={14} color="#666" />
                <Text style={styles.countText}>
                  {filteredAlerts.length} incident{filteredAlerts.length > 1 ? 's' : ''}
                </Text>
              </View>

              {/* Filtre par ville */}
              <TouchableOpacity
                style={styles.cityFilterButton}
                onPress={() => setShowCityMenu(!showCityMenu)}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.cityFilterText}>
                  {CITIES.find(c => c.id === selectedCity)?.name || 'Toutes'}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Menu déroulant des villes */}
            {showCityMenu && (
              <View style={styles.cityMenu}>
                {CITIES.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityMenuItem,
                      selectedCity === city.id && styles.cityMenuItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCity(city.id);
                      setShowCityMenu(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={16} color="#E94F23" />
                    <Text style={styles.cityMenuText}>{city.name}</Text>
                    {selectedCity === city.id && (
                      <Ionicons name="checkmark" size={16} color="#E94F23" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>Aucune alerte active</Text>
              <Text style={styles.emptySubtext}>
                {selectedCategory === 'all'
                  ? 'Il n\'y a aucune alerte active pour le moment'
                  : 'Aucune alerte dans cette catégorie'}
              </Text>
            </View>
          ) : (
            <BottomSheetFlatList
              data={filteredAlerts}
              renderItem={renderAlertItem}
              keyExtractor={(item: MapAlert) => item.id}
              contentContainerStyle={styles.bottomSheetContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    fontFamily: 'Lato',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 1000,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Lato-Bold',
  },
  categoryMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 400,
  },
  categoryMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  categoryMenuItemSelected: {
    backgroundColor: '#FFF5F2',
  },
  categoryMenuText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontFamily: 'Lato',
  },
  locationButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  bottomSheetContainer: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomSheetIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  bottomSheetHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bottomSheetTitleRow: {
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Lato-Bold',
  },
  bottomSheetFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Lato-Bold',
  },
  cityFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  cityFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Lato',
  },
  cityMenu: {
    position: 'absolute',
    top: 80,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 180,
  },
  cityMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  cityMenuItemSelected: {
    backgroundColor: '#FFF5F2',
  },
  cityMenuText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Lato',
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  // Nouveaux styles pour les cartes d'alertes (design Citizen-like)
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertCardSelected: {
    borderColor: '#E94F23',
    borderWidth: 2,
    backgroundColor: '#FFF5F2',
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  alertCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertCardTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',

  },
  alertCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Lato-Bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  alertCardMeta: {
    marginBottom: 8,
    marginLeft: 0,
    marginTop: 2,
  },
  alertCardMetaText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Lato',
  },
  alertCardDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Lato',
  },
  alertCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  commentInputPlaceholder: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Lato',
  },
  alertCardIconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Lato-Bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Lato',
    lineHeight: 20,
  },
});
