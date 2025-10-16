import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { getAllAlerts, type Alert, type CategoryAlert } from '@/services/api';
import CategorySelectionModal from '@/components/CategorySelectionModal';
import AlertDetailFormModal from '@/components/AlertDetailFormModal';
import Toast from '@/components/Toast';

export default function AlertsScreen() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryAlert | null>(null);

  // Alerts list state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const result = await getAllAlerts({ status: 'active', limit: 50 });
      if (result.success && result.data) {
        setAlerts(result.data.alerts);
      } else {
        showToast(result.error || 'Erreur lors du chargement', 'error');
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      showToast(error.message || 'Erreur de chargement', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAlerts();
  };

  const handleCreateAlert = () => {
    if (!isAuthenticated) {
      showToast('Vous devez être connecté pour créer une alerte', 'error');
      setTimeout(() => router.push('/auth/login'), 1000);
      return;
    }
    setCategoryModalVisible(true);
  };

  const handleSelectCategory = (category: CategoryAlert) => {
    setSelectedCategory(category);
    setCategoryModalVisible(false);
    setFormModalVisible(true);
  };

  const handleCloseModals = () => {
    setCategoryModalVisible(false);
    setFormModalVisible(false);
    setSelectedCategory(null);
  };

  const handleBackToCategories = () => {
    setFormModalVisible(false);
    setCategoryModalVisible(true);
  };

  const handleAlertCreated = () => {
    handleCloseModals();
    fetchAlerts(); // Refresh the list
  };

  const renderAlertItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity style={[styles.alertCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]} activeOpacity={0.8}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertCategoryBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.alertCategoryText}>{item.category}</Text>
        </View>
        <Text style={[styles.alertTime, { color: theme.colors.secondaryText }]}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={[styles.alertTitle, { color: theme.colors.primaryText }]} numberOfLines={2}>
        {item.displayTitle || item.title}
      </Text>
      <Text style={[styles.alertDescription, { color: theme.colors.secondaryText }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.alertFooter}>
        <View style={styles.alertLocation}>
          <Ionicons name="location" size={16} color={theme.colors.secondaryText} />
          <Text style={[styles.alertLocationText, { color: theme.colors.secondaryText }]} numberOfLines={1}>
            {item.location?.address || 'Localisation non disponible'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={80} color={theme.colors.icon} />
      <Text style={[styles.emptyTitle, { color: theme.colors.primaryText }]}>Aucune alerte</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.secondaryText }]}>Les alertes actives apparaîtront ici</Text>
      <TouchableOpacity style={[styles.createFirstButton, { backgroundColor: theme.colors.primary }]} onPress={handleCreateAlert}>
        <Text style={styles.createFirstButtonText}>Créer une alerte</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.colors.statusBar} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* Modals */}
      <CategorySelectionModal
        visible={categoryModalVisible}
        onClose={handleCloseModals}
        onSelectCategory={handleSelectCategory}
      />
      <AlertDetailFormModal
        visible={formModalVisible}
        category={selectedCategory}
        onClose={handleCloseModals}
        onBack={handleBackToCategories}
        onSuccess={handleAlertCreated}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Mes Alertes</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.secondaryText }]}>Alertes actives et notifications</Text>
        </View>
      </View>

      {/* Alerts List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>Chargement des alertes...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={handleCreateAlert} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'SUSE',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
  alertTime: {
    fontSize: 12,
    fontFamily: 'Lato',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'SUSE',
  },
  alertDescription: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Lato',
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  alertLocationText: {
    fontSize: 13,
    fontFamily: 'Lato',
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E94F23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
    fontFamily: 'SUSE',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Lato',
  },
  createFirstButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
});
