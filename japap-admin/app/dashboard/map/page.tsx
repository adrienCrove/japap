'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { fetchAlerts, Alert as ApiAlert } from '@/lib/api';

import { 
  Map as MapIcon,
  Circle,
  AlertTriangle,
  Users,
  Clock,
  Search,
  Loader2,
  MapPin
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

interface SearchedLocation {
    lat: number;
    lng: number;
    address: string;
}

export default function MapPage() {
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const layers = {
    activeAlerts: true,
    recentAlerts: true,
    heatmap: false,
    zones: true,
    administrative: false
  };

  
  // State for Geocoding search
  const [mapCenter, setMapCenter] = useState<[number, number]>([6.0, 12.0]);
  const [mapZoom, setMapZoom] = useState<number>(6);

  const [searchedLocation] = useState<SearchedLocation | null>(null);

  // States for alerts filtering and search
  const [alertSearchQuery, setAlertSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('nouvelles');
  const [selectedRegion, setSelectedRegion] = useState('');


  // Google Maps functionality temporarily disabled for type safety
  // Will be re-enabled with proper type definitions later

  // Données des régions du Cameroun avec leurs coordonnées
  const cameroonRegions = [
    { id: 'adamawa', name: 'Adamaoua', lat: 7.3697, lng: 12.7503, zoom: 8 },
    { id: 'centre', name: 'Centre', lat: 3.8480, lng: 11.5021, zoom: 8 },
    { id: 'east', name: 'Est', lat: 4.3732, lng: 15.7765, zoom: 8 },
    { id: 'far-north', name: 'Extrême-Nord', lat: 10.5962, lng: 14.2107, zoom: 8 },
    { id: 'littoral', name: 'Littoral', lat: 4.0511, lng: 9.7679, zoom: 9 },
    { id: 'north', name: 'Nord', lat: 9.3265, lng: 13.3781, zoom: 8 },
    { id: 'northwest', name: 'Nord-Ouest', lat: 6.2384, lng: 10.4734, zoom: 9 },
    { id: 'south', name: 'Sud', lat: 2.9840, lng: 11.5183, zoom: 8 },
    { id: 'southwest', name: 'Sud-Ouest', lat: 4.9553, lng: 9.2693, zoom: 9 },
    { id: 'west', name: 'Ouest', lat: 5.4755, lng: 10.4183, zoom: 9 }
  ];

  // Fonction pour gérer le changement de région
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    
    if (regionId === 'overview') {
      // Vue d'ensemble du Cameroun
      setMapCenter([6.0, 12.0]);
      setMapZoom(6);
    } else {
      const region = cameroonRegions.find(r => r.id === regionId);
      if (region) {
        setMapCenter([region.lat, region.lng]);
        setMapZoom(region.zoom);
      }
    }
  };

  // Fonction pour convertir les alertes de l'API vers le format MapAlert
  const convertApiAlertToMapAlert = (apiAlert: ApiAlert): MapAlert => {
    // Extraire les coordonnées depuis la location JSON
    let lat = 6.0, lng = 12.0, address = 'Adresse inconnue';
    
    if (apiAlert.location && typeof apiAlert.location === 'object') {
      const loc = apiAlert.location as { coordinates?: number[]; address?: string };
      if (loc.coordinates && Array.isArray(loc.coordinates)) {
        lat = loc.coordinates[0] || lat;
        lng = loc.coordinates[1] || lng;
      }
      address = loc.address || address;
    }

    // Mapper les catégories de l'API vers les catégories d'affichage
    const categoryMapping: Record<string, string> = {
      'Accident': 'Accident de circulation',
      'Vol': 'Aggression', 
      'Disparition': 'Disparition',
      'Incident': 'Incident',
      'Inondation': 'Inondation',
      'Manifestation': 'Manifestation',
      'Embouteillage': 'Embouteillage',
      'Panne': 'Panne d\'électricité'
    };

    // Mapper la sévérité de l'API (normal, grave) vers notre système (low, medium, high, critical)
    const severityMapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'normal': 'medium',
      'grave': 'high',
      'critique': 'critical',
      'faible': 'low'
    };

    // Mapper le statut de l'API vers notre système
    const statusMapping: Record<string, 'active' | 'pending' | 'resolved'> = {
      'active': 'active',
      'pending': 'pending', 
      'expired': 'resolved',
      'false': 'resolved'
    };

    return {
      id: apiAlert.id,
      category: categoryMapping[apiAlert.category] || apiAlert.category,
      severity: severityMapping[apiAlert.severity] || 'medium',
      status: statusMapping[apiAlert.status] || 'active',
      description: apiAlert.description || apiAlert.displayTitle || apiAlert.title,
      location: { lat, lng, address },
      createdAt: apiAlert.createdAt,
      confirmations: apiAlert.confirmations || 0,
      title: apiAlert.title || apiAlert.displayTitle || apiAlert.description
    };
  };

  useEffect(() => {
    const loadAlertsData = async () => {
      setLoading(true);
      setApiError(null);

      try {
        // Charger les alertes depuis l'API
        const response = await fetchAlerts();
        
        // Données mock conservées comme demandé
              const mockAlerts: MapAlert[] = [
          {
            id: 'ALT-CM-01',
            category: 'Accident de circulation',
            severity: 'high',
            status: 'active',
            title: 'Accident grave N3 Yaoundé',
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
              title: 'Inondation Makepe',
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
              title: 'Vague d\'agressions Ndogpassi',
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
              title: 'Manifestation Deido',
              description: 'Manifestation de la population de deido',
              location: { lat: 3.8721, lng: 11.5213, address: 'Deido, Douala, Cameroun'},
              createdAt: '2025-01-04T09:45:00Z',
              confirmations: 12
          },
          // Anciennes alertes pour tester le système d'onglets
          {
              id: 'ALT-CM-05',
              category: 'Embouteillage',
              severity: 'medium',
              status: 'resolved',
              title: 'Embouteillage Boulevard Liberté',
              description: 'Embouteillages importants sur le Boulevard de la Liberté',
              location: { lat: 4.0511, lng: 9.7679, address: 'Boulevard de la Liberté, Douala, Cameroun'},
              createdAt: '2025-01-02T14:30:00Z',
              confirmations: 5
          },
          {
              id: 'ALT-CM-06',
              category: 'Panne d\'électricité',
              severity: 'low',
              status: 'resolved',
              title: 'Panne électrique Bonanjo',
              description: 'Panne d\'électricité dans le quartier Bonanjo',
              location: { lat: 4.0496, lng: 9.6917, address: 'Bonanjo, Douala, Cameroun'},
              createdAt: '2025-01-01T16:15:00Z',
              confirmations: 3
          },
        ];

        let allAlerts = [...mockAlerts];

        // Si l'API retourne des alertes, les ajouter aux données mock
        if (response.success && response.data?.alerts) {
          const apiAlerts = response.data.alerts.map(convertApiAlertToMapAlert);
          allAlerts = [...allAlerts, ...apiAlerts];
        } else if (!response.success) {
          setApiError(response.error || 'Erreur lors du chargement des alertes');
          console.warn('Erreur API alertes:', response.error);
        }

        setAlerts(allAlerts);

        // Zones mock conservées
      const mockZones: Zone[] = [ 
        { id: 'zone-cm-1', name: 'Zone Commerciale Douala', type: 'polygon', coordinates: [ [4.0483, 9.7043], [4.0460, 9.7150], [4.0520, 9.7180], [4.0550, 9.7050] ], categories: ['incendie', 'accident'], channels: ['WhatsApp_Urgence_DLA', 'Telegram_Centre_DLA'], moderators: ['Admin Douala', 'Modérateur 1'], alertCount: 25, lastActivity: '2025-01-04T09:45:00Z', active: true }, 
        { id: 'zone-cm-2', name: 'Plateau Administratif Yaoundé', type: 'circle', coordinates: [[3.8721, 11.5213]], radius: 1000, categories: ['manifestation', 'sécurité'], channels: ['WhatsApp_Securite_YDE'], moderators: ['Admin Yaoundé'], alertCount: 15, lastActivity: '2025-01-03T15:00:00Z', active: true },
        { id: 'zone-cm-3', name: 'Marché de ndogpassi 2', type: 'polygon', coordinates: [ [4.0483, 9.7043], [4.0460, 9.7150], [4.0520, 9.7180], [4.0550, 9.7050] ], categories: ['sécurité', 'agression'], channels: ['WhatsApp_Urgence_DLA', 'Telegram_Centre_DLA'], moderators: ['Admin Douala', 'Modérateur 1'], alertCount: 25, lastActivity: '2025-01-04T09:45:00Z', active: true }, 
        { id: 'zone-cm-4', name: 'Rond point deido', type: 'circle', coordinates: [[3.8721, 11.5213]], radius: 1000, categories: ['manifestation', 'sécurité'], channels: ['WhatsApp_Securite_YDE'], moderators: ['Admin Yaoundé'], alertCount: 15, lastActivity: '2025-01-03T15:00:00Z', active: true }
      ];
        setZones(mockZones);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setApiError('Erreur de connexion à l\'API');
        
                // En cas d'erreur, utiliser seulement les données mock
        const mockAlerts: MapAlert[] = [
          {
            id: 'ALT-CM-01',
            category: 'Accident de circulation',
            severity: 'high',
            status: 'active',
            title: 'Accident grave N3 Yaoundé',
            description: 'Carambolage sur l\'axe lourd Douala-Yaoundé',
            location: { lat: 3.8480, lng: 11.5021, address: 'N3, Yaoundé, Cameroun' },
            createdAt: '2025-01-04T10:30:00Z',
            confirmations: 8
          }
        ];
      setAlerts(mockAlerts);
      } finally {
      setLoading(false);
      }
    };

    loadAlertsData();
  }, []);



  const getAlertIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'accident de circulation':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'inondation':
        return <Circle className="h-5 w-5 text-blue-600" />;
      case 'aggression':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'manifestation':
        return <Users className="h-5 w-5 text-purple-600" />;
      case 'embouteillage':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'panne d\'électricité':
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
      case 'disparition':
        return <Search className="h-5 w-5 text-orange-600" />;
      case 'incident':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' | 'green' | 'yellow' | 'blue' => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'yellow';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const handleAlertClick = (alert: MapAlert) => {
    setSelectedAlert(alert);
    // Center map on the alert
    setMapCenter([alert.location.lat, alert.location.lng]);
    setMapZoom(15);
  };

  const filteredAlerts = useMemo(() => {
    const currentFilters = {
      timeRange: '24h',
      severity: 'all',
      category: 'all',
      status: 'all'
    };
    
    return alerts.filter(alert => {
      // Filter by time range (nouvelles vs anciennes)
      const now = new Date();
      const alertDate = new Date(alert.createdAt);
      const hoursDiff = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60);
      
      const isRecent = hoursDiff <= 24; // Les alertes de moins de 24h sont considérées comme nouvelles
      
      if (activeTab === 'nouvelles' && !isRecent) return false;
      if (activeTab === 'anciennes' && isRecent) return false;
      
      // Filter by search query
      if (alertSearchQuery.trim()) {
        const query = alertSearchQuery.toLowerCase();
        const matches = alert.description.toLowerCase().includes(query) ||
                       alert.category.toLowerCase().includes(query) ||
                       alert.location.address.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      // Apply existing filters
      if (currentFilters.severity !== 'all' && alert.severity !== currentFilters.severity) return false;
      if (currentFilters.category !== 'all' && alert.category !== currentFilters.category) return false;
      if (currentFilters.status !== 'all' && alert.status !== currentFilters.status) return false;
      
      return true;
    });
  }, [alerts, activeTab, alertSearchQuery]);
  
  const allMapMarkers = useMemo(() => {
    const markers = [...filteredAlerts];
    if (searchedLocation) {
        markers.push({
            id: 'search-result',
            category: 'Résultat de recherche',
            severity: 'low',
            status: 'resolved', // to give it a neutral look
            title: 'Lieu recherché',
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
      <div className="w-[400px] border-r border-gray-200 bg-white flex flex-col">
        <Breadcrumb />
        
        {/* Region Selector */}
        <div className="p-4 border-b">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Région du Cameroun
            </label>
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">🇨🇲 Vue d&apos;ensemble du Cameroun</SelectItem>
                {cameroonRegions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    📍 {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
         {/*
        <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Carte & Zones</h1>
            <p className="text-sm text-gray-500">Vue opérationnelle temps réel</p>
        </div>

        Search Bar 
        <div className="p-4 border-b">
            <div className="relative">
                <Input 
                    ref={searchInputRef}
                    placeholder="Rechercher un lieu, une adresse... (bientôt disponible)"
                    disabled={true}
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
        */}

        {/* API Error Indicator */}
        {apiError && (
          <div className="mx-4 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center text-orange-800 text-sm">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Base de données indisponible - Affichage des données locales</span>
            </div>
          </div>
        )}

        {/* Alerts Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher dans les alertes..."
              value={alertSearchQuery}
              onChange={(e) => setAlertSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Alerts List with Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nouvelles" className="text-xs">
                  En cours ({alerts.filter(a => {
                    const now = new Date();
                    const alertDate = new Date(a.createdAt);
                    const hoursDiff = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60);
                    return hoursDiff <= 24;
                  }).length})
                </TabsTrigger>
                <TabsTrigger value="anciennes" className="text-xs">
                  Passées ({alerts.filter(a => {
                    const now = new Date();
                    const alertDate = new Date(a.createdAt);
                    const hoursDiff = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60);
                    return hoursDiff > 24;
                  }).length})
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="nouvelles" className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-3 mt-3">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune nouvelle alerte trouvée</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div key={alert.id} className={`cursor-pointer transition-all ${selectedAlert?.id === alert.id ? 'ring-2 ring-red-500  ring-opacity-50' : ''}`}>
                      <AlertCard
                          status={alert.severity.toUpperCase()}
                          badgeVariant={getSeverityBadge(alert.severity)}
                          icon={getAlertIcon(alert.category)}
                          title={alert.title}
                          category={alert.category}
                          description={alert.description}
                          location={alert.location.address}
                          onClick={() => handleAlertClick(alert)}
                      >
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(alert.createdAt).toLocaleString('fr-FR')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {alert.confirmations} confirmations
                          </Badge>
                        </div>
                      </AlertCard>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="anciennes" className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-3 mt-3">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune ancienne alerte trouvée</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div key={alert.id} className={`cursor-pointer transition-all ${selectedAlert?.id === alert.id ? 'ring-2 ring-red-500 ring-opacity-50' : ''}`}>
                        <AlertCard
                          status={alert.severity.toUpperCase()}
                          badgeVariant={getSeverityBadge(alert.severity)}
                          icon={getAlertIcon(alert.category)}
                          title={alert.title}
                          category={alert.category}
                          description={alert.description}
                          location={alert.location.address}
                          onClick={() => handleAlertClick(alert)}
                      >
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(alert.createdAt).toLocaleString('fr-FR')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {alert.confirmations} confirmations
                          </Badge>
                        </div>
                      </AlertCard>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          {/* Region Selector - Absolute positioned on map (solution qui fonctionnait) */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] min-w-[280px]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Région du Cameroun
              </label>
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">🇨🇲 Vue d&apos;ensemble du Cameroun</SelectItem>
                  {cameroonRegions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      📍 {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
            mode="view"
          />
        </div>
        {/* ... existing status bar */}
      </div>
    </div>
  );
}
