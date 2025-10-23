import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface EnhancementLoadingModalProps {
  visible: boolean;
  progress?: number; // 0-100
}

export default function EnhancementLoadingModal({ visible, progress = 0 }: EnhancementLoadingModalProps) {
  const { theme } = useTheme();
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          {/* Icon/Animation */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight || theme.colors.primary + '20' }]}>
            <Text style={styles.iconEmoji}>🎨</Text>
          </View>

          {/* Spinner */}
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.spinner}
          />

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.primaryText }]}>
            Amélioration en cours{dots}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
            Création d'un portrait HD pour faciliter l'identification
          </Text>

          {/* Progress indicator */}
          {progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${progress}%`
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.secondaryText }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          )}

          {/* Info text */}
          <Text style={[styles.info, { color: theme.colors.secondaryText }]}>
            Cette opération peut prendre quelques secondes
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Lato-Bold',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 10,
    fontFamily: 'Lato',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Lato',
  },
  info: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Lato',
  },
});
