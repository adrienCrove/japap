import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AlertSuccessModalProps {
  visible: boolean;
  alertId: string;
  alertTitle: string;
  onShare: () => void;
  onDismiss: () => void;
}

export default function AlertSuccessModal({
  visible,
  alertId,
  alertTitle,
  onShare,
  onDismiss,
}: AlertSuccessModalProps) {
  const { theme } = useTheme();

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Animate in: slide up + fade in + scale
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    } else {
      // Reset animations
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const handleDismiss = () => {
    // Animate out before dismissing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleShare = () => {
    // Animate out before sharing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onShare();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
            <Text style={styles.iconEmoji}>✅</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.primaryText }]}>
            Alerte créée avec succès !
          </Text>

          {/* Alert Title */}
          <Text style={[styles.alertTitle, { color: theme.colors.secondaryText }]}>
            "{alertTitle}"
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
            Voulez-vous partager cette alerte sur le fil d'actualités pour informer la communauté ?
          </Text>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: '#FFC107' }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>📢 Partager cette alerte</Text>
          </TouchableOpacity>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={[styles.dismissButton, { borderColor: theme.colors.border }]}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={[styles.dismissButtonText, { color: theme.colors.secondaryText }]}>
              Pas maintenant
            </Text>
          </TouchableOpacity>

          {/* Alert ID Reference */}
          <Text style={[styles.alertId, { color: theme.colors.tertiaryText }]}>
            Référence : {alertId}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Lato-Bold',
  },
  alertTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
    lineHeight: 22,
    paddingHorizontal: 10,
    fontFamily: 'Lato',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 4,
    fontFamily: 'Lato',
  },
  shareButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  dismissButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato',
  },
  alertId: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Lato',
  },
});
