import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VerificationLoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Récupérer les données des étapes précédentes
  const userInput = params.userInput as string || '';
  const firstName = params.firstName as string || '';
  const lastName = params.lastName as string || '';
  const password = params.password as string || '';
  const phone = params.phone as string || '';

  useEffect(() => {
    // Auto-navigation vers la page d'adresse après 2.5 secondes
    const timer = setTimeout(() => {
      router.push({
        pathname: '/auth/address',
        params: {
          userInput,
          firstName,
          lastName,
          password,
          phone
        }
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Progress bar - Étape 4/6 */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarInactive} />
        <View style={styles.progressBarInactive} />
      </View>

      {/* Contenu centré */}
      <View style={styles.content}>
        <Text style={styles.title}>Vérification de vos informations...</Text>

        {/* Loader */}
        <ActivityIndicator
          size="large"
          color="#E94F23"
          style={styles.loader}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 8,
    marginBottom: 40,
  },
  progressBarActive: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  progressBarInactive: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'SUSE',
    textAlign: 'center',
    marginBottom: 60,
  },
  loader: {
    transform: [{ scale: 1.5 }],
  },
});
