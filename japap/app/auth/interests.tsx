import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingModal from '@/components/LoadingModal';

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
  { id: 'other', label: 'Autre' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { register } = useAuth();
  const params = useLocalSearchParams();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer les données des étapes précédentes
  const userInput = params.userInput as string || '';
  const fullname = params.fullname as string || '';
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

    setIsLoading(true);

    try {
      // Créer le compte avec toutes les données
      const registerResult = await register({
        email: userInput.includes('@') ? userInput : undefined,
        phone: phone,
        password: password,
        fullname: fullname,
        address: address,
        interests: selectedInterests
      });

      if (registerResult.success) {
        // Succès - rediriger vers l'accueil après un délai
        setTimeout(() => {
          setIsLoading(false);
          Keyboard.dismiss();
          router.replace('/(tabs)');
        }, 1500);
      } else {
        setIsLoading(false);
        showToast(registerResult.error || 'Erreur lors de la création du compte');
      }
    } catch (error: any) {
      setIsLoading(false);
      showToast(error.message || 'Erreur lors de la création du compte');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Modal de chargement */}
      <LoadingModal visible={isLoading} message="Création du compte..." />

      {/* Header avec bouton retour et progress bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Barre de progression - Étape 4/4 */}
        <View style={styles.progressBarContainer}>
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
                  Sélectionnez tout ce qui s&apos;applique
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
