import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { getCategoryAlerts, type CategoryAlert } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import Toast from '@/components/Toast';

interface CategorySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: CategoryAlert) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 72) / 2; // 2 colonnes avec padding

export default function CategorySelectionModal({
  visible,
  onClose,
  onSelectCategory,
}: CategorySelectionModalProps) {
  const { theme } = useTheme();
  const [categories, setCategories] = useState<CategoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'error',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const result = await getCategoryAlerts({ isActive: true });
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        showToast(result.error || 'Erreur lors du chargement des catégories', 'error');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      showToast(error.message || 'Erreur de chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (category: CategoryAlert) => {
    onSelectCategory(category);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}>
          <View style={styles.headerTop}>
            <View style={styles.brandContainer}>
              <Ionicons name="layers" size={24} color={theme.colors.primary} />
              <Text style={[styles.brandText, { color: theme.colors.primaryText }]}>Incidents</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name="close" size={28} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={[styles.content, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.primaryText }]}>Que se passe-t-il ?</Text>
            <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
              Créez une alerte pour notifier les utilisateurs à proximité.
            </Text>
            <Text style={[styles.userCount, { color: theme.colors.secondaryText }]}>
              <Ionicons name="people" size={16} color={theme.colors.secondaryText} /> Utilisateurs à proximité
            </Text>
          </View>

          {/* Categories Grid */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>Chargement des catégories...</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: category.color || theme.colors.border,
                    },
                  ]}
                  onPress={() => handleSelectCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{category.icon || '📍'}</Text>
                  <Text style={[styles.categoryName, { color: theme.colors.primaryText }]}>{category.name}</Text>
                </TouchableOpacity>
              ))}

              {/* Autre chose */}
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  styles.otherCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => {
                  showToast('Veuillez sélectionner une catégorie spécifique', 'error');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>✏️</Text>
                <Text style={[styles.categoryName, { color: theme.colors.primaryText }]}>Autre chose</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SUSE',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'SUSE',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'Lato',
    lineHeight: 22,
  },
  userCount: {
    fontSize: 14,
    fontFamily: 'Lato',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
  },
  categoryCard: {
    width: CARD_WIDTH,
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  otherCard: {
    borderStyle: 'dashed',
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Lato',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato',
  },
});
