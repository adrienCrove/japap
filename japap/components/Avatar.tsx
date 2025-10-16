import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  name?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Génère une couleur cohérente basée sur le nom
 */
function generateColorFromName(name: string): string {
  if (!name) return '#E94F23'; // Couleur par défaut JAPAP

  // Hash simple du nom pour générer une couleur
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Palette de couleurs vibrantes pour les avatars
  const colors = [
    '#E94F23', // Orange JAPAP
    '#FF6B6B', // Rouge corail
    '#4ECDC4', // Turquoise
    '#45B7D1', // Bleu ciel
    '#FFA07A', // Saumon
    '#98D8C8', // Vert menthe
    '#F7DC6F', // Jaune doré
    '#BB8FCE', // Violet pastel
    '#85C1E2', // Bleu clair
    '#F8B88B', // Pêche
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Extrait la première lettre du nom (majuscule)
 */
function getInitial(name?: string): string {
  if (!name || name.trim().length === 0) return '?';
  return name.trim()[0].toUpperCase();
}

export default function Avatar({ name, size = 'medium' }: AvatarProps) {
  const initial = getInitial(name);
  const backgroundColor = generateColorFromName(name || '');

  const sizeConfig = {
    small: { container: 40, text: 18 },
    medium: { container: 60, text: 26 },
    large: { container: 100, text: 42 },
  };

  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: config.text }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'SUSE',
  },
});
