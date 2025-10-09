import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts/ToastContext';

export default function AddressScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const [address, setAddress] = useState('');

  // Récupérer les données des étapes précédentes
  const userInput = params.userInput as string || '';
  const firstName = params.firstName as string || '';
  const lastName = params.lastName as string || '';
  const password = params.password as string || '';
  const phone = params.phone as string || '';

  const handleBack = () => {
    router.back();
  };

  const handleFinish = async () => {
    if (!address.trim()) {
      showToast('Veuillez entrer une adresse');
      return;
    }

    // TODO: Créer le compte avec toutes les données
    const accountData = {
      email: userInput,
      password,
      firstName,
      lastName,
      phone,
      address: address.trim()
    };

    console.log('Création du compte avec:', accountData);

    // TODO: Appeler l'API pour créer le compte
    // await createAccount(accountData);

    // Fermer le clavier avant la navigation
    Keyboard.dismiss();

    // Naviguer vers la page des centres d'intérêt
    router.push({
      pathname: '/auth/interests',
      params: {
        userInput,
        firstName,
        lastName,
        password,
        phone,
        address: address.trim()
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header avec bouton retour et progress bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Barre de progression - Étape 5/6 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
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
              <Text style={styles.title}>Où habitez-vous ?</Text>

              {/* Champ de saisie manuel */}
              <TextInput
                style={styles.manualInput}
                placeholder="Entrez votre adresse (quartier, ville)..."
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                autoFocus
              />

              {/* Help text */}
              <View style={styles.helpContainer}>
                <Ionicons name="lock-closed" size={16} color="#666" />
                <Text style={styles.helpText}>
                  Votre adresse reste privée. Elle sera utilisée pour afficher du contenu local et vérifier les informations de votre entourage.
                </Text>
              </View>
            </View>

            {/* Bouton Terminer */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !address.trim() && styles.disabledButton
                ]}
                onPress={handleFinish}
                disabled={!address.trim()}
              >
                <Text style={styles.continueButtonText}>Terminer</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 8,
  },
  progressBarActive: {
    flex: 1,
    backgroundColor: '#000',
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
    marginBottom: 32,
    fontFamily: 'SUSE',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Lato',
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontFamily: 'Lato',
    lineHeight: 18,
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
  disabledButton: {
    opacity: 0.5,
  },
});
