'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Button } from '@/components/ui/button';

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
    administrative: false
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
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

  const createAlertIcon = (alert: MapAlert, isSelected: boolean = false) => {
    const color = getSeverityColor(alert.severity);
    const size = isSelected ? 30 : 20;
    
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
          font-size: 10px;
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
  };
  
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
      heatLayerRef.current = (L as any).heatLayer(heatmapData, { 
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
        const popupContent = `...`;
        marker.bindPopup(popupContent);
        marker.on('click', () => onAlertSelect(alert));
        alertMarkersRef.current.addLayer(marker);
      });
    }
  }, [alerts, layers.activeAlerts, layers.recentAlerts, selectedAlert, onAlertSelect]);

  useEffect(() => {
    if (!mapInstanceRef.current || !onZoneSelect) return;
    zoneLayersRef.current.clearLayers();

    if (layers.zones) {
      zones.forEach(zone => {
        const isSelected = selectedZone?.id === zone.id;
        const style = {
          color: isSelected ? '#DC2626' : '#3B82F6',
          weight: isSelected ? 3 : 2,
          opacity: 0.8,
          fillColor: isSelected ? '#FEE2E2' : '#DBEAFE',
          fillOpacity: 0.3
        };
        let layer: L.Layer;
        if (zone.type === 'circle' && zone.radius) {
          layer = L.circle([zone.coordinates[0][0], zone.coordinates[0][1]], { radius: zone.radius, ...style });
        } else {
          const latLngs: L.LatLngExpression[] = zone.coordinates.map(coord => [coord[0], coord[1]]);
          layer = L.polygon(latLngs, style);
        }
        const popupContent = `...`;
        layer.bindPopup(popupContent);
        layer.on('click', () => onZoneSelect(zone));
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
        </div>
      </div>
    </div>
  );
}
