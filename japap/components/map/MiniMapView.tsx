import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface MiniMapViewProps {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  markerColor?: string;
  height?: number;
  borderRadius?: number;
  isLoading?: boolean;
}

/**
 * Composant de carte miniature non-interactive
 * Utilisé pour afficher une position GPS avec un marqueur
 * Supporte les mises à jour dynamiques de région avec animation
 */
export default function MiniMapView({
  latitude,
  longitude,
  latitudeDelta = 0.002,
  longitudeDelta = 0.002,
  markerColor = '#E94F23',
  height = 150,
  borderRadius = 12,
  isLoading = false,
}: MiniMapViewProps) {
  const mapRef = useRef<MapView>(null);

  // Animer vers la nouvelle position quand les coordonnées ou le zoom changent
  useEffect(() => {
    if (mapRef.current && latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      const region: Region = {
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      };

      // Animation progressive et fluide vers la nouvelle région (2.5 secondes pour effet plus doux)
      mapRef.current.animateToRegion(region, 2500);
    }
  }, [latitude, longitude, latitudeDelta, longitudeDelta]);

  // Vérifier que les coordonnées sont valides
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return (
      <View style={[styles.errorContainer, { height, borderRadius }]}>
        <Text style={styles.errorText}>Coordonnées invalides</Text>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={[styles.map, { height, borderRadius }]}
        region={{
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
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
        {/* Halo externe bleu semi-transparent (effet Google Maps) */}
        <Circle
          center={{
            latitude,
            longitude,
          }}
          radius={40} // Rayon du halo en mètres
          fillColor="rgba(66, 133, 244, 0.15)" // Bleu Google avec transparence
          strokeColor="rgba(66, 133, 244, 0.3)"
          strokeWidth={0.5}
        />

        {/* Point central bleu (position exacte) */}
        <Circle
          center={{
            latitude,
            longitude,
          }}
          radius={8} // Rayon du point central en mètres
          fillColor="#E94F23" // Bleu Google
          strokeColor="#FFFFFF"
          strokeWidth={2}
        />
      </MapView>

      {/* Indicateur de chargement pendant la géolocalisation */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={markerColor} />
          <Text style={styles.loadingText}>Localisation...</Text>
        </View>
      )}
    </View>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Lato',
  },
});
