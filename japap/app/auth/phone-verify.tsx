import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts/ToastContext';

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const [phone, setPhone] = useState('');

  // Récupérer les données des étapes précédentes
  const userInput = params.userInput as string || '';
  const fullname = params.fullname as string || '';
  const password = params.password as string || '';

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    // Valider le numéro de téléphone
    const cleanPhone = phone.replace(/\s/g, '');

    if (cleanPhone.length !== 9) {
      showToast('Le numéro doit contenir exactement 9 chiffres');
      return;
    }

    if (!cleanPhone.startsWith('6')) {
      showToast('Le numéro doit commencer par 6');
      return;
    }

    // TODO: Appeler l'API pour envoyer le code SMS
    console.log('Envoi du code SMS au +237', cleanPhone);

    // Fermer le clavier avant la navigation
    Keyboard.dismiss();

    // Naviguer vers la page de vérification
    router.push({
      pathname: '/auth/verify-code',
      params: {
        userInput,
        fullname,
        password,
        phone: `+237${cleanPhone}`
      }
    });
  };

  // Formater le numéro pendant la saisie
  const handlePhoneChange = (text: string) => {
    // Garder seulement les chiffres
    const digits = text.replace(/\D/g, '');

    // Limiter à 9 chiffres
    const limited = digits.slice(0, 9);

    // Formater : 6XX XX XX XX
    let formatted = limited;
    if (limited.length > 3) {
      formatted = limited.slice(0, 3) + ' ' + limited.slice(3);
    }
    if (limited.length > 5) {
      formatted = limited.slice(0, 3) + ' ' + limited.slice(3, 5) + ' ' + limited.slice(5);
    }
    if (limited.length > 7) {
      formatted = limited.slice(0, 3) + ' ' + limited.slice(3, 5) + ' ' + limited.slice(5, 7) + ' ' + limited.slice(7);
    }

    setPhone(formatted);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header avec bouton retour et progress bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Barre de progression - Étape 2/4 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarActive} />
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
              <Text style={styles.title}>Vérifiez votre numéro</Text>

              {/* Sous-titre */}
              <Text style={styles.subtitle}>
                Nous allons vous envoyer un code de vérification par SMS
              </Text>

              {/* Champ téléphone avec indicatif intégré */}
              <View style={styles.phoneInputContainer}>
                <View style={styles.phonePrefix}>
                  <Ionicons name="globe" size={20} color="#666" />
                  <Text style={styles.countryCodeText}>+237</Text>
                  <View style={styles.separator} />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="6XX XX XX XX"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={12} // 9 chiffres + 3 espaces
                  autoFocus
                />
              </View>

              {/* Info helper 
              <Text style={styles.helperText}>
                Numéro de téléphone camerounais
              </Text>*/}
            </View>

            {/* Bouton Continue */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Envoyer le code</Text>
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
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
    fontFamily: 'Lato',
    lineHeight: 22,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Lato-Bold',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato',
    color: '#000',
    paddingLeft: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
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
