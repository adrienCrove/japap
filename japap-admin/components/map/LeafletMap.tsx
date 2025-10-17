'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.gridlayer.googlemutant';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Fix for default markers in React
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapAlert {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'pending' | 'resolved';
  description: string;
  title: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: string;
  confirmations: number;
}

interface Zone {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: number[][];
  radius?: number;
  categories: string[];
  channels: string[];
  moderators: string[];
  alertCount: number;
  lastActivity: string;
  active: boolean;
}

export type HeatmapPoint = [number, number, number]; // [lat, lng, intensity]

interface LeafletMapProps {
  alerts?: MapAlert[];
  zones?: Zone[];
  heatmapData?: HeatmapPoint[];
  layers?: {
    activeAlerts?: boolean;
    recentAlerts?: boolean;
    heatmap?: boolean;
    zones?: boolean;
    administrative?: boolean;
    traffic?: boolean;
  };
  selectedAlert?: MapAlert | null;
  selectedZone?: Zone | null;
  onAlertSelect?: (alert: MapAlert | null) => void;
  onZoneSelect?: (zone: Zone | null) => void;
  mode?: 'view' | 'draw';
  center?: [number, number];
  zoom?: number;
}

export default function LeafletMap({
  alerts = [],
  zones = [],
  heatmapData = [],
  layers = {
    activeAlerts: true,
    recentAlerts: true,
    heatmap: false,
    zones: true,
    administrative: false,
    traffic: false
  },
  selectedAlert,
  selectedZone,
  onAlertSelect,
  onZoneSelect,
  mode = 'view',
  center = [6.0, 12.0],
  zoom = 6
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const alertMarkersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const zoneLayersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const trafficLayerRef = useRef<any>(null);
  const [showTraffic, setShowTraffic] = useState(layers.traffic || false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      alertMarkersRef.current.addTo(mapInstanceRef.current);
      zoneLayersRef.current.addTo(mapInstanceRef.current);
    }

    return () => {
      // Clean up zone pulse intervals
      const zoneLayerGroup = zoneLayersRef.current;
      if (zoneLayerGroup) {
        zoneLayerGroup.eachLayer((layer: L.Layer & { _pulseInterval?: NodeJS.Timeout }) => {
          if (layer._pulseInterval) {
            clearInterval(layer._pulseInterval);
          }
        });
      }

      // Clean up traffic layer
      if (trafficLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(trafficLayerRef.current);
        trafficLayerRef.current = null;
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  // Effet séparé pour mettre à jour le centre et le zoom de la carte
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const createAlertIcon = useCallback((alert: MapAlert, isSelected: boolean = false) => {
    const color = getSeverityColor(alert.severity);
    const size = isSelected ? 40 : 28; // Augmentation de la taille : 20→28, 30→40
    
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background-color: ${color}; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.5}px;
          color: white;
          font-weight: bold;
        ">
          ${alert.severity === 'critical' ? '🔥' : 
            alert.severity === 'high' ? '⚠️' : 
            alert.severity === 'medium' ? '⚡' : '📍'}
        </div>
      `,
      className: 'custom-alert-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }, []);
  
  // Heatmap Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove the old layer if it exists
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Add the new layer if conditions are met
    if (layers.heatmap && heatmapData.length > 0) {
      heatLayerRef.current = (L as typeof L & { heatLayer: (data: HeatmapPoint[], options: { radius: number; blur: number; maxZoom: number }) => L.HeatLayer }).heatLayer(heatmapData, { 
        radius: 25,
        blur: 15,
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }
  }, [heatmapData, layers.heatmap]);


  useEffect(() => {
    if (!mapInstanceRef.current || !onAlertSelect) return;

    alertMarkersRef.current.clearLayers();

    if (layers.activeAlerts || layers.recentAlerts) {
      alerts.forEach(alert => {
        const isSelected = selectedAlert?.id === alert.id;
        const marker = L.marker(
          [alert.location.lat, alert.location.lng],
          { icon: createAlertIcon(alert, isSelected) }
        );
        const popupContent = `
          <div class="min-w-[200px] p-2">
            <div class="font-semibold text-gray-800 mb-2 text-sm">${alert.title || alert.description}</div>
            <div class="space-y-1">
              <div class="flex items-center text-xs text-gray-600">
                <span class="font-medium mr-2">Type:</span>
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${alert.category}</span>
              </div>
              <div class="text-xs text-gray-600 mt-2">
                <span class="font-medium">📍 Localisation:</span><br/>
                <span class="text-gray-700">${alert.location.address}</span>
              </div>
              <div class="text-xs text-gray-500 mt-2 pt-2 border-t">
                ${alert.confirmations} confirmation${alert.confirmations !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.on('click', () => onAlertSelect(alert));
        alertMarkersRef.current.addLayer(marker);
      });
    }
  }, [alerts, layers.activeAlerts, layers.recentAlerts, selectedAlert, onAlertSelect, createAlertIcon]);

  useEffect(() => {
    if (!mapInstanceRef.current || !onZoneSelect) return;
    
    // Clean up existing intervals before clearing layers
    zoneLayersRef.current.eachLayer((layer: L.Layer & { _pulseInterval?: NodeJS.Timeout }) => {
      if (layer._pulseInterval) {
        clearInterval(layer._pulseInterval);
      }
    });
    
    zoneLayersRef.current.clearLayers();

    if (layers.zones) {
      zones.forEach((zone, index) => {
        const isSelected = selectedZone?.id === zone.id;
        const isActive = zone.active;
        
        // Base style for zones
        const baseStyle = {
          color: isSelected ? '#DC2626' : (isActive ? '#10B981' : '#3B82F6'),
          weight: isSelected ? 4 : (isActive ? 3 : 2),
          opacity: isSelected ? 1 : (isActive ? 0.9 : 0.7),
          fillColor: isSelected ? '#FEE2E2' : (isActive ? '#D1FAE5' : '#DBEAFE'),
          fillOpacity: isSelected ? 0.4 : (isActive ? 0.35 : 0.2)
        };

        let layer: L.Layer;
        if (zone.type === 'circle' && zone.radius) {
          layer = L.circle([zone.coordinates[0][0], zone.coordinates[0][1]], { 
            radius: zone.radius, 
            ...baseStyle,
            className: isActive ? 'zone-active-circle' : 'zone-circle'
          });
        } else {
          const latLngs: L.LatLngExpression[] = zone.coordinates.map(coord => [coord[0], coord[1]]);
          layer = L.polygon(latLngs, { 
            ...baseStyle,
            className: isActive ? 'zone-active-polygon' : 'zone-polygon'
          });
        }

        // Popup content with more details
        const popupContent = `
          <div class="font-semibold text-blue-900">${zone.name}</div>
          <div class="text-xs text-gray-600 mt-1">
            Type: ${zone.type === 'circle' ? 'Zone circulaire' : 'Zone polygonale'}
          </div>
          <div class="text-xs text-gray-600">
            Alertes: ${zone.alertCount}
          </div>
          <div class="text-xs mt-2">
            <span class="inline-block w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'} mr-1"></span>
            ${isActive ? 'Zone active' : 'Zone inactive'}
          </div>
        `;
        
        layer.bindPopup(popupContent);
        layer.on('click', () => onZoneSelect(zone));
        
        // Add pulsing animation for active zones
        if (isActive) {
          setTimeout(() => {
            if (layer instanceof L.Circle || layer instanceof L.Polygon) {
              // Create a pulsing effect by temporarily changing opacity
              const originalOpacity = layer.options.fillOpacity;
              const pulseAnimation = () => {
                if (layer && mapInstanceRef.current?.hasLayer(layer)) {
                  layer.setStyle({ fillOpacity: 0.6 });
                  setTimeout(() => {
                    if (layer && mapInstanceRef.current?.hasLayer(layer)) {
                      layer.setStyle({ fillOpacity: originalOpacity });
                    }
                  }, 800);
                }
              };
              // Start pulsing animation with slight delay for each zone
              const pulseInterval = setInterval(pulseAnimation, 3000);
              // Store interval reference for cleanup
              (layer as L.Layer & { _pulseInterval?: NodeJS.Timeout })._pulseInterval = pulseInterval;
            }
          }, index * 500); // Stagger the animations
        }
        
        zoneLayersRef.current.addLayer(layer);
      });
    }
  }, [zones, layers.zones, selectedZone, onZoneSelect]);

  useEffect(() => {
    if (selectedAlert && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedAlert.location.lat, selectedAlert.location.lng], 15);
    }
  }, [selectedAlert]);

  useEffect(() => {
    if (selectedZone && mapInstanceRef.current) {
      if (selectedZone.type === 'circle') {
        mapInstanceRef.current.setView([selectedZone.coordinates[0][0], selectedZone.coordinates[0][1]], 14);
      } else {
        const bounds = L.latLngBounds(selectedZone.coordinates.map(coord => [coord[0], coord[1]]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [selectedZone]);

  // Traffic Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing traffic layer
    if (trafficLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(trafficLayerRef.current);
      trafficLayerRef.current = null;
    }

    // Add traffic layer if enabled
    if (showTraffic) {
      try {
        // @ts-ignore - gridLayer.googleMutant is added by the library
        if (typeof L.gridLayer.googleMutant === 'function') {
          // @ts-ignore
          trafficLayerRef.current = L.gridLayer.googleMutant({
            type: 'roadmap',
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
              { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
            ]
          });

          // Add traffic layer
          // @ts-ignore
          trafficLayerRef.current.addGoogleLayer('TrafficLayer');
          trafficLayerRef.current.addTo(mapInstanceRef.current);
        } else {
          console.warn('Google Mutant plugin not loaded. Traffic layer unavailable.');
        }
      } catch (error) {
        console.error('Error loading traffic layer:', error);
      }
    }

    return () => {
      if (trafficLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(trafficLayerRef.current);
        trafficLayerRef.current = null;
      }
    };
  }, [showTraffic]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      
      {mode === 'draw' && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <h3 className="font-semibold text-gray-900 mb-2">Mode Dessin</h3>
          <p className="text-sm text-gray-600 mb-3">
            Cliquez sur la carte pour commencer à dessiner une zone
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              🔵 Nouveau cercle
            </Button>
            <Button variant="outline" className="w-full justify-start">
              📐 Nouveau polygone
            </Button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Légende</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>Critique</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
            <span>Élevée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
            <span>Moyenne</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Faible</span>
          </div>
          <hr className="my-2" />
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-blue-600 bg-blue-100"></div>
            <span>Zones</span>
          </div>
          <hr className="my-2" />
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>
              <span>Trafic</span>
            </div>
            <Switch
              checked={showTraffic}
              onCheckedChange={setShowTraffic}
              className="scale-75"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
