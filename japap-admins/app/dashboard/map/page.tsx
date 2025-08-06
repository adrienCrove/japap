'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Map as MapIcon,
  Layers,
  Circle,
  Square,
  AlertTriangle,
  Filter,
  Eye,
  Settings,
  Download,
  Users,
  Clock,
  Search,
  X,
  Loader2
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';

const Map = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Chargement de la carte...</p>
      </div>
    </div>
  )
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

interface SearchedLocation {
    lat: number;
    lng: number;
    address: string;
}

export default function MapPage() {
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [layers, setLayers] = useState({
    activeAlerts: true,
    recentAlerts: true,
    heatmap: false,
    zones: true,
    administrative: false
  });
  const [filters, setFilters] = useState({
    timeRange: '24h',
    severity: 'all',
    category: 'all',
    status: 'all'
  });
  const [mapMode, setMapMode] = useState<'view' | 'draw'>('view');
  
  // State for Geocoding search
  const [mapCenter, setMapCenter] = useState<[number, number]>([6.0, 12.0]);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<SearchedLocation | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);


  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setGoogleMapsLoaded(true);
        return;
      }
      if (document.querySelector('script[src*="maps.googleapis.com"]')) return;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (googleMapsLoaded && searchInputRef.current && !autocompleteRef.current) {
      const options = {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'cm' },
      };
      
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, options);
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }
  }, [googleMapsLoaded]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place && place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || 'Adresse inconnue';

      setMapCenter([lat, lng]);
      setMapZoom(15);
      setSearchedLocation({ lat, lng, address });
      toast.success(`Lieu trouvé : ${address}`);
    } else {
      toast.error("Impossible de trouver les détails pour ce lieu.");
    }
  };

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      const mockAlerts: MapAlert[] = [
        {
          id: 'ALT-CM-01',
          category: 'Accident de circulation',
          severity: 'high',
          status: 'active',
          description: 'Carambolage sur l\'axe lourd Douala-Yaoundé',
          location: { lat: 3.8480, lng: 11.5021, address: 'N3, Yaoundé, Cameroun' },
          createdAt: '2025-01-04T10:30:00Z',
          confirmations: 8
        },
        {
            id: 'ALT-CM-02',
            category: 'Inondation',
            severity: 'critical',
            status: 'active',
            description: 'Quartier Makepe bloqué par la montée des eaux',
            location: { lat: 4.0483, lng: 9.7043, address: 'Makepe, Douala, Cameroun'},
            createdAt: '2025-01-04T09:45:00Z',
            confirmations: 12
        },
        {
            id: 'ALT-CM-03',
            category: 'Aggression',
            severity: 'critical',
            status: 'active',
            description: 'Quartier ndogpassi 2  victime d\'une vague d\'aggression', 
            location: { lat: 3.8721, lng: 11.5213, address: 'Ndogpassi 2, Douala, Cameroun'},
            createdAt: '2025-01-04T09:45:00Z',
            confirmations: 12
        },
        {
            id: 'ALT-CM-04',
            category: 'Manifestation',
            severity: 'critical',
            status: 'active',
            description: 'Manifestation de la population de deido',
            location: { lat: 3.8721, lng: 11.5213, address: 'Deido, Douala, Cameroun'},
            createdAt: '2025-01-04T09:45:00Z',
            confirmations: 12
        },
      ];
      const mockZones: Zone[] = [ 
        { id: 'zone-cm-1', name: 'Zone Commerciale Douala', type: 'polygon', coordinates: [ [4.0483, 9.7043], [4.0460, 9.7150], [4.0520, 9.7180], [4.0550, 9.7050] ], categories: ['incendie', 'accident'], channels: ['WhatsApp_Urgence_DLA', 'Telegram_Centre_DLA'], moderators: ['Admin Douala', 'Modérateur 1'], alertCount: 25, lastActivity: '2025-01-04T09:45:00Z', active: true }, 
        { id: 'zone-cm-2', name: 'Plateau Administratif Yaoundé', type: 'circle', coordinates: [[3.8721, 11.5213]], radius: 1000, categories: ['manifestation', 'sécurité'], channels: ['WhatsApp_Securite_YDE'], moderators: ['Admin Yaoundé'], alertCount: 15, lastActivity: '2025-01-03T15:00:00Z', active: true },
        { id: 'zone-cm-3', name: 'Marché de ndogpassi 2', type: 'polygon', coordinates: [ [4.0483, 9.7043], [4.0460, 9.7150], [4.0520, 9.7180], [4.0550, 9.7050] ], categories: ['sécurité', 'agression'], channels: ['WhatsApp_Urgence_DLA', 'Telegram_Centre_DLA'], moderators: ['Admin Douala', 'Modérateur 1'], alertCount: 25, lastActivity: '2025-01-04T09:45:00Z', active: true }, 
        { id: 'zone-cm-4', name: 'Rond point deido', type: 'circle', coordinates: [[3.8721, 11.5213]], radius: 1000, categories: ['manifestation', 'sécurité'], channels: ['WhatsApp_Securite_YDE'], moderators: ['Admin Yaoundé'], alertCount: 15, lastActivity: '2025-01-03T15:00:00Z', active: true }
      ];
      setAlerts(mockAlerts);
      setZones(mockZones);
      setLoading(false);
    }, 1000);
  }, []);

  const clearSearch = () => {
    if(searchInputRef.current) searchInputRef.current.value = "";
    setSearchedLocation(null);
    setMapCenter([6.0, 12.0]);
    setMapZoom(6);
    searchInputRef.current?.focus();
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // ... (existing filter logic)
      return true;
    });
  }, [alerts, filters]);
  
  const allMapMarkers = useMemo(() => {
    const markers = [...filteredAlerts];
    if (searchedLocation) {
        markers.push({
            id: 'search-result',
            category: 'Résultat de recherche',
            severity: 'low',
            status: 'resolved', // to give it a neutral look
            description: searchedLocation.address,
            location: { lat: searchedLocation.lat, lng: searchedLocation.lng, address: searchedLocation.address },
            createdAt: new Date().toISOString(),
            confirmations: 0,
        });
    }
    return markers;
  }, [filteredAlerts, searchedLocation]);
  
  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;

  return (
    <div className="h-full flex bg-gray-50">
      {/* Left Panel */}
      <div className="w-[350px] border-r border-gray-200 bg-white flex flex-col">
        <Breadcrumb />
        <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Carte & Zones</h1>
            <p className="text-sm text-gray-500">Vue opérationnelle temps réel</p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
            <div className="relative">
                <Input 
                    ref={searchInputRef}
                    placeholder="Rechercher un lieu, une adresse..."
                    disabled={!googleMapsLoaded}
                    className="pr-8"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    {searchInputRef.current?.value && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clearSearch}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            {searchedLocation && (
                <div className="mt-2 text-xs p-2 bg-blue-50 rounded-md text-blue-800">
                    <span className="font-semibold">Résultat :</span> {searchedLocation.address}
                </div>
            )}
        </div>

        {/* Rest of the panel ... */}
        <div className="flex-1 overflow-y-auto">
          {/* ... existing layers, filters, alerts list */}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <Map
            center={mapCenter}
            zoom={mapZoom}
            alerts={allMapMarkers}
            zones={zones}
            layers={layers}
            selectedAlert={selectedAlert}
            selectedZone={selectedZone}
            onAlertSelect={setSelectedAlert}
            onZoneSelect={setSelectedZone}
            mode={mapMode}
          />
        </div>
        {/* ... existing status bar */}
      </div>
    </div>
  );
}
