import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated, TouchableWithoutFeedback, Easing, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ReanimatedAnimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export type ContentType = 'alerts' | 'news';

interface AlertHeaderProps {
  scope: string;
  timeFilter: string;
  contentType?: ContentType;
  onScopeChange?: (scope: string) => void;
  onTimeFilterChange?: (filter: string) => void;
  onContentTypeChange?: (type: ContentType) => void;
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

const TAB_OPTIONS: { label: string; value: ContentType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Alertes', value: 'alerts', icon: 'alert-circle' },
  { label: 'Actualités', value: 'news', icon: 'newspaper' },
];

export default function AlertHeader({
  scope,
  timeFilter,
  contentType = 'alerts',
  onScopeChange,
  onTimeFilterChange,
  onContentTypeChange,
}: AlertHeaderProps) {
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tabWidths, setTabWidths] = useState<{ [key: string]: number }>({});

  // Animations pour le modal de scope
  const scopeBackdropOpacity = useRef(new Animated.Value(0)).current;
  const scopeContentTranslateY = useRef(new Animated.Value(300)).current;

  // Animations pour le modal de temps
  const timeBackdropOpacity = useRef(new Animated.Value(0)).current;
  const timeContentTranslateY = useRef(new Animated.Value(300)).current;

  // Animations pour l'indicateur de tab (Reanimated)
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

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

  const handleTabChange = (type: ContentType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContentTypeChange?.(type);
  };

  const handleTabLayout = (type: ContentType, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    setTabWidths((prev) => ({ ...prev, [type]: width, [`${type}_x`]: x }));
  };

  // Animer l'indicateur quand le contentType change
  useEffect(() => {
    const currentIndex = TAB_OPTIONS.findIndex((tab) => tab.value === contentType);
    if (currentIndex !== -1 && tabWidths[contentType]) {
      indicatorPosition.value = withTiming(tabWidths[`${contentType}_x`] || 0, { duration: 300 });
      indicatorWidth.value = withTiming(tabWidths[contentType] || 0, { duration: 300 });
    }
  }, [contentType, tabWidths]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }));

  return (
    <>
      <View style={styles.mainContainer}>
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

          <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowTimeModal(true)}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeFilter} onPress={() => setShowTimeModal(true)}>
            <Ionicons name="filter-outline" size={24} color="#666" />
          </TouchableOpacity>
          </View>
        </View>

        {/* Tabs Alertes / Actualités */}
        <View style={styles.tabsContainer}>
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={styles.tab}
              onPress={() => handleTabChange(tab.value)}
              onLayout={(event) => handleTabLayout(tab.value, event)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={contentType === tab.value ? '#E94F23' : '#999'}
              />
              <Text
                style={[
                  styles.tabText,
                  contentType === tab.value && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Indicateur animé */}
          <ReanimatedAnimated.View style={[styles.tabIndicator, indicatorStyle]} />
        </View>
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
  mainContainer: {
    backgroundColor: '#fff',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingBottom: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontFamily: 'Lato',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    fontFamily: 'Lato',
  },
  tabTextActive: {
    color: '#E94F23',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: '#E94F23',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E94F23',
    letterSpacing: 0.5,
  },

  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
