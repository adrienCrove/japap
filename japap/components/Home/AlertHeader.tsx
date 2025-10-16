import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated, TouchableWithoutFeedback, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

interface AlertHeaderProps {
  scope: string;
  timeFilter: string;
  onScopeChange?: (scope: string) => void;
  onTimeFilterChange?: (filter: string) => void;
}

const SCOPE_OPTIONS = [
  { label: 'Dans le continent', value: 'nationwide', icon: 'globe-outline' },
  { label: 'Dans la région', value: 'region', icon: 'location-outline' },
  { label: 'Dans la ville', value: 'city', icon: 'home-outline' },
];

const TIME_FILTERS = [
  { label: 'Past 24h', value: '24h' },
  { label: 'Past 7 jours', value: '7d' },
  { label: 'Past 30 jours', value: '30d' },
  { label: 'Tout le temps', value: 'all' },
];

export default function AlertHeader({
  scope,
  timeFilter,
  onScopeChange,
  onTimeFilterChange,
}: AlertHeaderProps) {
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Animations pour le modal de scope
  const scopeBackdropOpacity = useRef(new Animated.Value(0)).current;
  const scopeContentTranslateY = useRef(new Animated.Value(300)).current;

  // Animations pour le modal de temps
  const timeBackdropOpacity = useRef(new Animated.Value(0)).current;
  const timeContentTranslateY = useRef(new Animated.Value(300)).current;

  const selectedScope = SCOPE_OPTIONS.find(s => s.value === scope) || SCOPE_OPTIONS[0];
  const selectedTime = TIME_FILTERS.find(t => t.value === timeFilter) || TIME_FILTERS[0];

  // Animation d'ouverture/fermeture du modal scope
  useEffect(() => {
    if (showScopeModal) {
      Animated.parallel([
        Animated.timing(scopeBackdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scopeContentTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scopeBackdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scopeContentTranslateY, {
          toValue: 300,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showScopeModal]);

  // Animation d'ouverture/fermeture du modal temps
  useEffect(() => {
    if (showTimeModal) {
      Animated.parallel([
        Animated.timing(timeBackdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(timeContentTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(timeBackdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(timeContentTranslateY, {
          toValue: 300,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showTimeModal]);

  const handleScopeSelect = (value: string) => {
    onScopeChange?.(value);
    setShowScopeModal(false);
  };

  const handleTimeSelect = (value: string) => {
    onTimeFilterChange?.(value);
    setShowTimeModal(false);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Logo/Brand
        <View style={styles.brand}>
          <Ionicons name="shield-checkmark" size={24} color="#FF0000" />
          <Text style={styles.brandText}>JAPAP.COM</Text>
        </View>*/}

        {/* Scope Selector */}
        <TouchableOpacity style={styles.selector} onPress={() => setShowScopeModal(true)}>
          <Ionicons name={selectedScope.icon as any} size={16} color="#000" />
          <Text style={styles.selectorText}>{selectedScope.label}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>

        {/* Time Filter */}
        <TouchableOpacity style={styles.timeFilter} onPress={() => setShowTimeModal(true)}>
          <Text style={styles.timeFilterText}>{selectedTime.label}</Text>
        </TouchableOpacity>
      </View>

      {/* Scope Selection Modal */}
      <Modal
        visible={showScopeModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowScopeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowScopeModal(false)}>
          <Animated.View
            style={[
              styles.modalOverlay,
              { opacity: scopeBackdropOpacity }
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  { transform: [{ translateY: scopeContentTranslateY }] }
                ]}
              >
                <SafeAreaView>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Scope</Text>
                    <TouchableOpacity onPress={() => setShowScopeModal(false)}>
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView>
                    {SCOPE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.option,
                          scope === option.value && styles.optionSelected,
                        ]}
                        onPress={() => handleScopeSelect(option.value)}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={24}
                          color={scope === option.value ? '#FF0000' : '#666'}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            scope === option.value && styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {scope === option.value && (
                          <Ionicons name="checkmark" size={24} color="#FF0000" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </SafeAreaView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Time Filter Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimeModal(false)}>
          <Animated.View
            style={[
              styles.modalOverlay,
              { opacity: timeBackdropOpacity }
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  { transform: [{ translateY: timeContentTranslateY }] }
                ]}
              >
                <SafeAreaView>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Time Range</Text>
                    <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView>
                    {TIME_FILTERS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.option,
                          timeFilter === option.value && styles.optionSelected,
                        ]}
                        onPress={() => handleTimeSelect(option.value)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            timeFilter === option.value && styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {timeFilter === option.value && (
                          <Ionicons name="checkmark" size={24} color="#FF0000" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </SafeAreaView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.5,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timeFilter: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeFilterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionSelected: {
    backgroundColor: '#fff5f5',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#FF0000',
    fontWeight: '600',
  },
});
