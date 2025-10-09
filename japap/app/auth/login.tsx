import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneMode] = useState(false); // setIsPhoneMode commenté car toggle désactivé

  const handleClose = () => {
    router.back();
  };

  const handleContinue = () => {
    // Naviguer vers la page de création de compte avec l'email/phone et mot de passe
    const userInput = isPhoneMode ? phone : email;
    router.push({
      pathname: '/auth/signup',
      params: { userInput, isPhone: isPhoneMode, password }
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validation simple : email/phone et password doivent être remplis
  const isFormValid = (isPhoneMode ? phone.length > 0 : email.length > 0) && password.length > 0;

  const handleGoogleLogin = () => {
    // TODO: Implémenter Google OAuth
    console.log('Poursuivre avec Google');
  };

  // const handleToggleMode = () => {
  //   setIsPhoneMode(!isPhoneMode);
  //   // Réinitialiser les champs lors du toggle
  //   setEmail('');
  //   setPhone('');
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Bouton fermer */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={32} color="#000" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        {/* Titre */}
        <Text style={styles.title}>Créer un compte ou se connecter</Text>

        {/* Texte légal */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            Nous utiliserons cette information pour vous connecter ou créer un compte.
          </Text>
        </View>

        {/* Champ Email ou Phone */}
        <TextInput
          style={styles.emailInput}
          placeholder={isPhoneMode ? "Numéro de téléphone" : "Email"}
          placeholderTextColor="#999"
          value={isPhoneMode ? phone : email}
          onChangeText={isPhoneMode ? setPhone : setEmail}
          keyboardType={isPhoneMode ? "phone-pad" : "email-address"}
          autoCapitalize="none"
          autoComplete={isPhoneMode ? "tel" : "email"}
        />

        {/* Champ Mot de passe */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Bouton Continue */}
        <TouchableOpacity
          style={[styles.continueButton, !isFormValid && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <Text style={styles.continueButtonText}>Poursuivre</Text>
        </TouchableOpacity>

        {/* Séparateur OR */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>Ou</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Boutons OAuth */}
        <View style={styles.oauthContainer}>
          {/* Google */}
          <TouchableOpacity style={styles.oauthButton} onPress={handleGoogleLogin}>
            <Ionicons name="logo-google" size={24} color="#4285F4" />
            <Text style={styles.oauthButtonText}>Poursuivre avec Google</Text>
          </TouchableOpacity>

          {/* Toggle Email/Phone - COMMENTÉ TEMPORAIREMENT */}
          {/* <TouchableOpacity style={styles.oauthButton} onPress={handleToggleMode}>
            <Ionicons
              name={isPhoneMode ? "mail" : "phone-portrait-outline"}
              size={24}
              color="#000"
            />
            <Text style={styles.oauthButtonText}>
              {isPhoneMode ? "Se connecter par email" : "Utiliser le numéro de téléphone"}
            </Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    fontFamily: 'SUSE',
  },
  legalContainer: {
    marginBottom: 28,
  },
  legalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    fontFamily: 'Lato',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'Lato',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: 'Lato',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  continueButton: {
    backgroundColor: '#E94F23',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 24,
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
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCC',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Lato',
  },
  oauthContainer: {
    gap: 12,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    gap: 12,
  },
  oauthButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'Lato',
  },
});
