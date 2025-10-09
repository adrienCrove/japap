import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreenExpo from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

import { useColorScheme } from '@/hooks/use-color-scheme';
import SplashScreen from '@/components/SplashScreen';

// Empêcher le splashscreen natif de se cacher automatiquement
SplashScreenExpo.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // Charger les polices personnalisées
  const [fontsLoaded] = useFonts({
    'SUSE': require('../assets/fonts/SUSE-Variable.ttf'),
    'Lato': require('../assets/fonts/Lato-Regular.ttf'),
    'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf'),
  });

  // Étape 1: Splash + vérification AsyncStorage
  useEffect(() => {
    async function prepare() {
      try {
        // Cacher le splashscreen natif
        await SplashScreenExpo.hideAsync();

        // Attendre 4 secondes pour afficher notre custom splash
        await new Promise(resolve => setTimeout(resolve, 4000));

        // DEV ONLY: Décommenter pour toujours afficher l'onboarding
        await AsyncStorage.removeItem('onboarding_seen');

        // Vérifier si l'onboarding a déjà été vu
        const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');

        // Déterminer la route initiale
        if (onboardingSeen === 'true') {
          setInitialRoute('/(tabs)');
        } else {
          setInitialRoute('/onboarding');
        }
      } catch (e) {
        console.warn(e);
        // En cas d'erreur, aller vers onboarding par défaut
        setInitialRoute('/onboarding');
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  // Étape 2: Navigation une fois que tout est prêt
  useEffect(() => {
    if (isReady && initialRoute && fontsLoaded) {
      router.replace(initialRoute as any);
    }
  }, [isReady, initialRoute, fontsLoaded, router]);

  if (!isReady || !fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="auth/phone-verify" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="auth/verify-code" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="auth/address" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
