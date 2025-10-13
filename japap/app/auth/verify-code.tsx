import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts/ToastContext';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Récupérer les données des étapes précédentes
  const userInput = params.userInput as string || '';
  const fullname = params.fullname as string || '';
  const password = params.password as string || '';
  const phone = params.phone as string || '';

  const handleBack = () => {
    router.back();
  };

  // Timer pour le renvoi du code
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleCodeChange = (text: string, index: number) => {
    // Garder seulement les chiffres
    const digit = text.replace(/\D/g, '').slice(0, 1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus sur le suivant si un chiffre est saisi
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Revenir en arrière si backspace sur un champ vide
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');

    if (fullCode.length !== 4) {
      showToast('Veuillez entrer le code complet');
      return;
    }

    // TODO: Vérifier le code avec l'API
    console.log('Vérification du code:', fullCode);

    // Fermer le clavier avant la navigation
    Keyboard.dismiss();

    // Naviguer vers la page de vérification
    router.push({
      pathname: '/auth/verification-loading',
      params: {
        userInput,
        fullname,
        password,
        phone
      }
    });
  };

  const handleResend = () => {
    if (!canResend) return;

    // TODO: Appeler l'API pour renvoyer le code
    console.log('Renvoi du code SMS au', phone);

    // Réinitialiser le timer
    setTimer(60);
    setCanResend(false);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isCodeComplete = code.every(digit => digit !== '');

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
              <Text style={styles.title}>Entrez le code de vérification</Text>

              {/* Sous-titre */}
              <Text style={styles.subtitle}>
                Code envoyé au {phone}
              </Text>

              {/* Inputs pour le code */}
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {/* Lien renvoyer le code */}
              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}>Renvoyer le code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Renvoyer le code dans {timer}s
                  </Text>
                )}
              </View>
            </View>

            {/* Bouton Vérifier */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !isCodeComplete && styles.disabledButton
                ]}
                onPress={handleVerify}
                disabled={!isCodeComplete}
              >
                <Text style={styles.continueButtonText}>Vérifier</Text>
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
    marginBottom: 12,
    fontFamily: 'SUSE',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 40,
    fontFamily: 'Lato',
    lineHeight: 22,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  codeInput: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: '#CCC',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
    color: '#000',
  },
  codeInputFilled: {
    borderColor: '#E94F23',
    backgroundColor: '#FFF5F2',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#E94F23',
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  timerText: {
    fontSize: 14,
    color: '#999',
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
  disabledButton: {
    opacity: 0.5,
  },
});
