import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapAlert {
  id: string;
  ref_alert_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'resolved' | 'rejected';
  title: string;
  displayTitle: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: string;
}

interface NativeMapViewProps {
  alerts: MapAlert[];
  selectedAlert?: MapAlert | null;
  onAlertSelect?: (alert: MapAlert) => void;
  center?: [number, number];
  zoom?: number;
}

export default function NativeMapView({
  alerts = [],
  selectedAlert,
  onAlertSelect,
  center = [4.0511, 9.7679], // Douala, Cameroun
  zoom = 10,
}: NativeMapViewProps) {
  const mapRef = useRef<MapView>(null);

  // Centrer sur l'alerte sélectionnée
  useEffect(() => {
    if (selectedAlert?.location?.lat && selectedAlert?.location?.lng && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: selectedAlert.location.lat,
        longitude: selectedAlert.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [selectedAlert]);

  // Ajuster la vue pour voir toutes les alertes
  useEffect(() => {
    if (alerts.length > 0 && mapRef.current) {
      const validCoordinates = alerts
        .filter(alert => alert.location?.lat && alert.location?.lng)
        .map(alert => ({
          latitude: alert.location.lat,
          longitude: alert.location.lng,
        }));

      if (validCoordinates.length > 0) {
        mapRef.current.fitToCoordinates(validCoordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  }, [alerts]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#EAB308';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        latitude: center[0],
        longitude: center[1],
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={true}
      showsScale={true}
      showsTraffic={true}  // ✅ Active le trafic en temps réel
      showsIndoors={false}
      showsBuildings={false}
      showsIndoorLevelPicker={false}
    >
      {alerts
        .filter(alert => alert.location?.lat && alert.location?.lng)
        .map((alert) => {
          const isSelected = selectedAlert?.id === alert.id;
          return (
            <Marker
              key={alert.id}
              coordinate={{
                latitude: alert.location.lat,
                longitude: alert.location.lng,
              }}
              title={alert.title}
              description={alert.description}
              onPress={() => onAlertSelect?.(alert)}
              pinColor={getSeverityColor(alert.severity)}
              opacity={isSelected ? 1 : 0.8}
              zIndex={isSelected ? 1000 : 1}
            />
          );
        })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
