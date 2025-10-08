import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Logo centré */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Version en bas */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0~dev</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC645',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 280,
  },
  versionContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
