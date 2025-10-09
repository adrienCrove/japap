import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts/ToastContext';

type Interest = {
  id: string;
  label: string;
};

const INTERESTS: Interest[] = [
  { id: 'nearby_alerts', label: 'Alertes de sécurité à proximité' },
  { id: 'breaking_news', label: 'Actualités importantes dans ma ville' },
  { id: 'get_help', label: 'Demander de l\'aide aux autres' },
  { id: 'past_incidents', label: 'Incidents de sécurité passés dans ma zone' },
  { id: 'location_monitoring', label: 'Surveillance de localisation (domicile, travail)' },
  { id: 'police_radio', label: 'Radio police et pompiers' },
  { id: 'other', label: 'Autre' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Récupérer les données des étapes précédentes
  const userInput = params.userInput as string || '';
  const firstName = params.firstName as string || '';
  const lastName = params.lastName as string || '';
  const password = params.password as string || '';
  const phone = params.phone as string || '';
  const address = params.address as string || '';

  const handleBack = () => {
    router.back();
  };

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      showToast('Veuillez sélectionner au moins un centre d\'intérêt');
      return;
    }

    // TODO: Créer le compte avec toutes les données incluant les centres d'intérêt
    const accountData = {
      email: userInput,
      password,
      firstName,
      lastName,
      phone,
      address,
      interests: selectedInterests
    };

    console.log('Création du compte avec:', accountData);

    // TODO: Appeler l'API pour créer le compte
    // await createAccount(accountData);

    // Fermer le clavier avant la navigation
    Keyboard.dismiss();

    // Naviguer vers l'application principale
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header avec bouton retour et progress bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Barre de progression - Étape 6/6 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Contenu principal */}
              <View style={styles.contentContainer}>
                {/* Titre */}
                <Text style={styles.title}>Comment JAPAP peut-il vous aider ?</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>
                  Sélectionnez les fonctionnalités qui vous intéressent.
                </Text>

                {/* Instruction */}
                <Text style={styles.instruction}>
                  Sélectionnez tout ce qui s'applique
                </Text>

                {/* Liste des centres d'intérêt */}
                <View style={styles.interestsContainer}>
                  {INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                      <TouchableOpacity
                        key={interest.id}
                        style={[
                          styles.interestItem,
                          isSelected && styles.interestItemSelected
                        ]}
                        onPress={() => toggleInterest(interest.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={20} color="#fff" />
                          )}
                        </View>
                        <Text style={styles.interestLabel}>{interest.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bouton Continue */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  selectedInterests.length === 0 && styles.disabledButton
                ]}
                onPress={handleContinue}
                disabled={selectedInterests.length === 0}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'SUSE',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
    fontFamily: 'Lato',
    lineHeight: 22,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    fontFamily: 'Lato-Bold',
  },
  interestsContainer: {
    gap: 12,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestItemSelected: {
    backgroundColor: '#FFF5F2',
    borderColor: '#E94F23',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#E94F23',
    borderColor: '#E94F23',
  },
  interestLabel: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontFamily: 'Lato',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#fff',
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
