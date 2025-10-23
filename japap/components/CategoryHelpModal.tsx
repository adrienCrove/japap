import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CategoryHelpModalProps {
  visible: boolean;
  onClose: () => void;
  category: {
    code: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    responseTime: number;
    emergencyServices: string[];
  } | null;
}

export default function CategoryHelpModal({
  visible,
  onClose,
  category,
}: CategoryHelpModalProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(300)).current;

  // Animation d'ouverture/fermeture
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 300,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!category) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: contentTranslateY }] }
              ]}
            >
              {/* Header fixe */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Informations sur la catégorie</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Content scrollable */}
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={true}
                scrollEventThrottle={16}
                overScrollMode="always"
              >
                <View style={styles.categoryInfo}>
                    {/* Icône et nom */}
                    <View style={styles.categoryHeader}>
                      <Text style={[styles.categoryIcon, { color: category.color }]}>
                        {category.icon}
                      </Text>
                      <View style={styles.categoryTitleContainer}>
                        <Text style={[styles.categoryName, { color: category.color }]}>
                          {category.name}
                        </Text>
                        <View style={styles.categoryCodeBadge}>
                          <Text style={styles.categoryCodeText}>{category.code}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Description */}
                    {category.description && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{category.description}</Text>
                      </View>
                    )}

                    {/* Temps d'intervention */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Temps d'intervention</Text>
                      <View style={styles.infoBox}>
                        <Ionicons name="time-outline" size={20} color={category.color} />
                        <Text style={styles.infoText}>
                          {category.responseTime} minutes
                        </Text>
                      </View>
                    </View>

                    {/* Services d'urgence */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Services d'urgence associés</Text>
                      <View style={styles.servicesContainer}>
                        {category.emergencyServices.map((service, index) => (
                          <View
                            key={index}
                            style={[
                              styles.serviceBadge,
                              { backgroundColor: `${category.color}15` }
                            ]}
                          >
                            <Text style={[styles.serviceText, { color: category.color }]}>
                              {service}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Conseils */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>💡 Conseils</Text>
                      <View style={styles.tipsBox}>
                        <Text style={styles.tipText}>
                          • Soyez précis dans votre description
                        </Text>
                        <Text style={styles.tipText}>
                          • Indiquez votre localisation exacte
                        </Text>
                        <Text style={styles.tipText}>
                          • Ajoutez des photos si possible
                        </Text>
                        <Text style={styles.tipText}>
                          • Restez disponible pour d'éventuelles questions
                        </Text>
                      </View>
                    </View>
                </View>
              </ScrollView>

              {/* Footer */}
              <SafeAreaView edges={['bottom']}>
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.closeButtonFooter, { backgroundColor: category.color }]}
                    onPress={onClose}
                  >
                    <Text style={styles.closeButtonText}>Compris</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'SUSE',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  categoryInfo: {
    padding: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'SUSE',
  },
  categoryCodeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Lato',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'SUSE',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Lato',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Lato',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Lato',
  },
  tipsBox: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Lato',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  closeButtonFooter: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
});
