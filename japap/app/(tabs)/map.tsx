import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getAllAlerts } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import NativeMapView from '@/components/map/NativeMapView';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const snapPoints = useMemo(() => ['25%', '50%', '75%'], []);

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

  // Rendu d'un item d'alerte dans le bottom sheet
  const renderAlertItem = ({ item }: { item: MapAlert }) => {
    const isSelected = selectedAlert?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.alertItem, isSelected && styles.alertItemSelected]}
        onPress={() => handleAlertSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.alertIcon, { backgroundColor: getMarkerColor(item.category) + '20' }]}>
          <Ionicons name={getCategoryIcon(item.category)} size={24} color={getMarkerColor(item.category)} />
        </View>

        <View style={styles.alertContent}>
          <Text style={styles.alertTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.alertDescription} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.alertLocation} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color="#666" /> {item.location.address}
          </Text>
        </View>

        <View style={styles.alertMeta}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            <Ionicons name="alert-circle" size={16} color="#fff" />
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
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertItemSelected: {
    borderColor: '#E94F23',
    borderWidth: 2,
    backgroundColor: '#FFF5F2',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    fontFamily: 'Lato-Bold',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontFamily: 'Lato',
    lineHeight: 18,
  },
  alertLocation: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Lato',
  },
  alertMeta: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
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
