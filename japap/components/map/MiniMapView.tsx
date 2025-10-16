import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface MiniMapViewProps {
  latitude: number;
  longitude: number;
  markerColor?: string;
  height?: number;
  borderRadius?: number;
}

/**
 * Composant de carte miniature non-interactive
 * Utilisé pour afficher une position GPS avec un marqueur
 */
export default function MiniMapView({
  latitude,
  longitude,
  markerColor = '#E94F23',
  height = 150,
  borderRadius = 12,
}: MiniMapViewProps) {
  // Vérifier que les coordonnées sont valides
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return (
      <View style={[styles.errorContainer, { height, borderRadius }]}>
        <Text style={styles.errorText}>Coordonnées invalides</Text>
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={[styles.map, { height, borderRadius }]}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.002, // Zoom très précis sur la zone (environ 200m)
        longitudeDelta: 0.002,
      }}
      // Désactiver toutes les interactions
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      // Désactiver les contrôles
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={false}
      showsScale={false}
      // Désactiver les POIs pour une carte plus propre
      showsPointsOfInterest={false}
      showsBuildings={false}
      showsTraffic={false}
      showsIndoors={false}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        pinColor={markerColor}
        tracksViewChanges={false} // Optimisation: ne pas rerender le marqueur
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    overflow: 'hidden',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Lato',
  },
});
