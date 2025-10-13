import React, { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

interface MapAlert {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface LeafletMapViewProps {
  alerts: MapAlert[];
  selectedAlert?: MapAlert | null;
  onAlertSelect?: (alert: MapAlert) => void;
  center?: [number, number];
  zoom?: number;
}

export default function LeafletMapView({
  alerts = [],
  selectedAlert,
  onAlertSelect,
  center = [4.0511, 9.7679], // Douala, Cameroun
  zoom = 10,
}: LeafletMapViewProps) {
  const webViewRef = useRef<WebView>(null);

  // Mettre à jour la carte quand les alertes changent
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateAlerts',
        alerts: alerts
      }));
    }
  }, [alerts]);

  // Mettre à jour la sélection
  useEffect(() => {
    if (webViewRef.current && selectedAlert) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'selectAlert',
        alertId: selectedAlert.id
      }));
    }
  }, [selectedAlert]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#EAB308';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accident': return '🚗';
      case 'aggression': return '⚠️';
      case 'inondation': return '💧';
      case 'manifestation': return '👥';
      case 'embouteillage': return '🚦';
      case 'panne': return '⚡';
      case 'disparition': return '🔍';
      default: return '📍';
    }
  };

  // HTML de la carte Leaflet
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { height: 100%; width: 100%; }
        .custom-alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-size: 16px;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
        .leaflet-popup-content {
          margin: 12px;
          min-width: 200px;
        }
        .popup-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          color: #1F2937;
        }
        .popup-description {
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 8px;
        }
        .popup-location {
          font-size: 11px;
          color: #9CA3AF;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Initialiser la carte
        const map = L.map('map', {
          zoomControl: true,
          attributionControl: false
        }).setView([${center[0]}, ${center[1]}], ${zoom});

        // Ajouter les tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        // Stocker les marqueurs
        const markers = {};
        let selectedMarkerId = null;

        // Fonction pour obtenir la couleur selon la sévérité
        function getSeverityColor(severity) {
          const colors = {
            'critical': '#DC2626',
            'high': '#EA580C',
            'medium': '#EAB308',
            'low': '#059669'
          };
          return colors[severity] || '#6B7280';
        }

        // Fonction pour obtenir l'icône selon la catégorie
        function getCategoryIcon(category) {
          const icons = {
            'accident': '🚗',
            'aggression': '⚠️',
            'inondation': '💧',
            'manifestation': '👥',
            'embouteillage': '🚦',
            'panne': '⚡',
            'disparition': '🔍'
          };
          return icons[category] || '📍';
        }

        // Créer un icône personnalisé
        function createAlertIcon(alert, isSelected) {
          const color = getSeverityColor(alert.severity);
          const size = isSelected ? 40 : 32;
          const icon = getCategoryIcon(alert.category);

          return L.divIcon({
            html: \`
              <div class="custom-alert-icon" style="
                width: \${size}px;
                height: \${size}px;
                background-color: \${color};
              ">
                \${icon}
              </div>
            \`,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -(size / 2)]
          });
        }

        // Fonction pour mettre à jour les alertes
        function updateAlerts(alertsData) {
          // Supprimer les anciens marqueurs
          Object.values(markers).forEach(marker => map.removeLayer(marker));
          Object.keys(markers).forEach(key => delete markers[key]);

          // Ajouter les nouveaux marqueurs
          alertsData.forEach(alert => {
            const isSelected = alert.id === selectedMarkerId;
            const marker = L.marker(
              [alert.location.lat, alert.location.lng],
              { icon: createAlertIcon(alert, isSelected) }
            );

            const popupContent = \`
              <div>
                <div class="popup-title">\${alert.title}</div>
                <div class="popup-description">\${alert.description}</div>
                <div class="popup-location">📍 \${alert.location.address}</div>
              </div>
            \`;

            marker.bindPopup(popupContent);
            marker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'alertSelected',
                alertId: alert.id
              }));
            });

            marker.addTo(map);
            markers[alert.id] = marker;
          });

          // Ajuster la vue pour voir tous les marqueurs
          if (alertsData.length > 0) {
            const group = L.featureGroup(Object.values(markers));
            map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14 });
          }
        }

        // Fonction pour sélectionner une alerte
        function selectAlert(alertId) {
          selectedMarkerId = alertId;

          // Mettre à jour l'icône de l'alerte sélectionnée
          Object.keys(markers).forEach(id => {
            const marker = markers[id];
            const alert = currentAlerts.find(a => a.id === id);
            if (alert) {
              const isSelected = id === alertId;
              marker.setIcon(createAlertIcon(alert, isSelected));

              if (isSelected) {
                map.setView([alert.location.lat, alert.location.lng], 15);
                marker.openPopup();
              }
            }
          });
        }

        // Stocker les alertes courantes
        let currentAlerts = ${JSON.stringify(alerts)};
        updateAlerts(currentAlerts);

        // Écouter les messages de React Native
        window.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'updateAlerts') {
              currentAlerts = data.alerts;
              updateAlerts(currentAlerts);
            } else if (data.type === 'selectAlert') {
              selectAlert(data.alertId);
            }
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        });

        // Pour Android
        document.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'updateAlerts') {
              currentAlerts = data.alerts;
              updateAlerts(currentAlerts);
            } else if (data.type === 'selectAlert') {
              selectAlert(data.alertId);
            }
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html }}
      style={styles.webView}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={true}
      onMessage={(event) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'alertSelected' && onAlertSelect) {
            const alert = alerts.find(a => a.id === data.alertId);
            if (alert) {
              onAlertSelect(alert);
            }
          }
        } catch (e) {
          console.error('Error handling message from WebView:', e);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
