import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleCreateAccount = () => {
    router.push('/auth/login');
  };
  const handleConsulter = async () => {
    try {
      // Marquer l'onboarding comme vu
      await AsyncStorage.setItem('onboarding_seen', 'true');
      // Naviguer vers la page d'accueil
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      router.replace('/(tabs)');
    }
  };

  const handlePolitiqueSecurite = () => {
    // Ouvrir la politique de sécurité (à définir plus tard)
    console.log('Ouvrir politique de sécurité');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Image principale */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/onboarding/smartphone-hand.png')}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        {/* Titre */}
        <Text style={styles.title}>Bienvenue sur Japap!</Text>

        {/* Description */}
        <Text style={styles.description}>
          Consulter toutes les informations liés à{'\n'}
          l'actualité et la situation dans votre entourage
        </Text>

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          {/* Bouton Créer compte (désactivé) */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateAccount}>
            <Text style={styles.primaryButtonText}>Créer votre compte gratuitement</Text>
          </TouchableOpacity>

          {/* Bouton Se connecter (désactivé) */}
          <TouchableOpacity style={styles.secondaryButton} disabled>
            <Text style={styles.secondaryButtonText}>Se connecter</Text>
          </TouchableOpacity>

          {/* Lien Consulter */}
          <TouchableOpacity onPress={handleConsulter}>
            <Text style={styles.consultLink}>Consulter</Text>
          </TouchableOpacity>
        </View>

        {/* Politique de sécurité */}
        <View style={styles.securityContainer}>
          <Text style={styles.securityText}>
            Consulter notre{' '}
            <Text style={styles.securityLink} onPress={handlePolitiqueSecurite}>
              politique de sécurité
            </Text>
            {' '}pour apprendre{'\n'}
            comment vos données personnelles sont utilisées sur Japap
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 54,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainImage: {
    width: 200,
    height: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Lato-Bold',
  },
  description: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'Lato',
  },
  securityContainer: {
    marginTop: 24,
    marginBottom: 30,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Lato',
  },
  securityLink: {
    color: '#E94F23',
    textDecorationLine: 'underline',
    fontFamily: 'Lato',
  },
  buttonsContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#E94F23',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E94F23',
  },
  secondaryButtonText: {
    color: '#E94F23',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  consultLink: {
    color: '#E94F23',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Lato-Bold',
  },
});
