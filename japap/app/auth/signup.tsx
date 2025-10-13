import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { checkUser } from '@/services/api';
import LoadingModal from '@/components/LoadingModal';

export default function SignupScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { login } = useAuth();
  const params = useLocalSearchParams();
  const [fullname, setFullname] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  // Récupérer l'email/phone depuis les params
  const userInput = params.userInput as string || '';

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    // Valider les champs
    if (!fullname.trim()) {
      showToast('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier si l'utilisateur existe déjà avec ces identifiants
      const checkResult = await checkUser(userInput);

      if (checkResult.success && checkResult.exists) {
        // L'utilisateur existe - tenter la connexion automatique
        const password = params.password as string || '';

        if (password) {
          const loginResult = await login(userInput, password);

          if (loginResult.success) {
            // Connexion réussie - rediriger vers l'accueil
            setTimeout(() => {
              setIsLoading(false);
              Keyboard.dismiss();
              router.replace('/(tabs)');
            }, 1500);
            return;
          }
        }
      }

      // L'utilisateur n'existe pas ou la connexion a échoué - continuer le flux d'inscription
      setIsLoading(false);
      Keyboard.dismiss();

      // Naviguer vers la page de vérification du téléphone
      router.push({
        pathname: '/auth/phone-verify',
        params: {
          userInput,
          fullname: fullname.trim(),
          password: params.password as string || ''
        }
      });
    } catch (error: any) {
      setIsLoading(false);
      showToast(error.message || 'Erreur lors de la vérification');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Modal de chargement */}
      <LoadingModal visible={isLoading} message="Vérification en cours..." />

      {/* Header avec bouton retour et progress bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Barre de progression - Étape 1/4   */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarInactive} />
          <View style={styles.progressBarInactive} />
          <View style={styles.progressBarInactive} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Contenu principal */}
            <View style={styles.contentContainer}>
              {/* Titre */}
              <Text style={styles.title}>Compléter votre profil ! </Text>
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitleText}>
                Quel est votre nom d&apos;utilisateur ?
                </Text>
                
              </View>

              {/* Champ Nom complet */}
              <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur"
                placeholderTextColor="#999"
                value={fullname}
                onChangeText={setFullname}
                autoCapitalize="words"
                autoComplete="given-name"
              />

    
            </View>

            {/* Bouton Continue */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
    gap: 8,
    paddingRight: 16,
  },
  progressBarActive: {
    flex: 1,
    backgroundColor: '#E94F23',
    borderRadius: 2,
  },
  progressBarInactive: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    fontFamily: 'SUSE',
  },
  subtitleContainer: {
    marginBottom: 28,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    fontFamily: 'Lato',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'Lato',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: '#E94F23',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
});
