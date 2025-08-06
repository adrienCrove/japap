'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  MapPin, 
  User, 
  Calendar,
  Save,
  ArrowLeft,
  Search,
  Upload,
  X,
  Camera,
  Video,
  Mic,
  Loader2,
  Navigation
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { createManualAlert } from '@/lib/api';

// Types de catégories et leurs préfixes de référence
const INCIDENT_CATEGORIES = {
  'Incident général': 'INC',
  'Vol': 'TH',
  'Disparition': 'DIS',
  'Accident de circulation': 'ACC',
  'Incendie': 'FIR',
  'Inondation': 'FLD',
  'Éboulement': 'LDS',
  'Agression': 'ASS',
  'Cambriolage': 'BRG',
  'Urgence médicale': 'MED',
} as const;

interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio';
}

interface AlertFormData {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  mediaFiles: MediaFile[];
  expiresAt?: string;
  status: 'active' | 'pending';
}                   

// Détection automatique de la source selon le canal
const getSourceFromChannel = (): 'app' | 'whatsapp' | 'telegram' | 'sms' | 'email' | 'web' => {
  // Dans un cas réel, ceci serait déterminé par l'authentification ou le canal d'accès
  // Pour l'instant, on retourne 'app' pour l'interface admin
  return 'web';
};

export default function CreateAlertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewRef, setPreviewRef] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  
  const [formData, setFormData] = useState<AlertFormData>({
    category: '',
    severity: 'medium',
    description: '',
    location: {
      address: '',
      coordinates: [0, 0]
    },
    mediaFiles: [],
    expiresAt: '',
    status: 'active'
  });

  // Charger Google Maps API - VERSION CORRIGÉE
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Vérifier si l'API est déjà chargée
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps API already loaded');
        setGoogleMapsLoaded(true);
        return;
      }

      // Utiliser NEXT_PUBLIC_ pour les variables côté client
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined!');
        toast.error('Configuration manquante', {
          description: 'La clé API Google Maps n\'est pas configurée. Vérifiez que NEXT_PUBLIC_GOOGLE_MAPS_API_KEY est définie dans .env.local'
        });
        return;
      }

      console.log('🔄 Loading Google Maps API...');

      // Éviter le double chargement
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('⚠️ Google Maps script already exists');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Fonction callback globale
      (window as any).initGoogleMaps = () => {
        console.log('✅ Google Maps API loaded successfully');
        setGoogleMapsLoaded(true);
        // Nettoyer la fonction callback
        delete (window as any).initGoogleMaps;
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps API:', error);
        toast.error('Erreur de chargement', {
          description: 'Impossible de charger l\'API Google Maps. Vérifiez votre clé API et votre connexion internet.'
        });
        delete (window as any).initGoogleMaps;
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();

    // Cleanup au démontage du composant
    return () => {
      if ((window as any).initGoogleMaps) {
        delete (window as any).initGoogleMaps;
      }
    };
  }, []);

// Initialiser Google Places Autocomplete - VERSION AMÉLIORÉE
useEffect(() => {
    if (!googleMapsLoaded || !inputRef.current) {
      return;
    }

    // Éviter la double initialisation
    if (autocompleteRef.current) {
      console.log('⚠️ Autocomplete already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing Google Places Autocomplete...');
      
              const options = {
          types: [],
          componentRestrictions: { country: ['cm'] }, // Cameroun uniquement
          fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
        };

      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        console.log('📍 Place selected:', place);
        
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          setFormData(prev => ({
            ...prev,
            location: {
              address: place.formatted_address || '',
              coordinates: [lat, lng]
            }
          }));
          
          console.log('✅ Location updated:', { lat, lng, address: place.formatted_address });
          toast.success('Adresse sélectionnée');
        } else {
          console.warn('⚠️ Place without geometry selected');
          toast.warning('Adresse incomplète', {
            description: 'Cette adresse ne contient pas de coordonnées précises'
          });
        }
      };

      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);
      console.log('✅ Google Places Autocomplete initialized');
      
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
      toast.error('Erreur d\'initialisation', {
        description: 'Impossible d\'initialiser la recherche d\'adresses'
      });
    }

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [googleMapsLoaded]);

  // Générer la référence d'alerte
  const generateAlertReference = (category: string): string => {
    const prefix = INCIDENT_CATEGORIES[category as keyof typeof INCIDENT_CATEGORIES] || 'INC';
    const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ALT/${prefix}-${randomNumber}`;
  };

  // Mettre à jour la référence quand la catégorie change
  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    if (category) {
      setPreviewRef(generateAlertReference(category));
    } else {
      setPreviewRef('');
    }
  };

  // Obtenir la position actuelle
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    if (!googleMapsLoaded) {
        toast.error('Google Maps n\'est pas encore chargé, veuillez patienter');
        return;
      }

    setGettingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('🔄 Position actuelle:', { latitude, longitude });
        
        try {
          // Utiliser le geocoder pour obtenir l'adresse
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
              location: { lat: latitude, lng: longitude }
            });

            let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            if (response.results && response.results.length > 0) {
              address = response.results[0].formatted_address;
              console.log('🔄 Adresse obtenue:', address);
            }
              setFormData(prev => ({
                ...prev,
                location: {
                  address: address,
                  coordinates: [latitude, longitude]
                }
              }));

              if (inputRef.current) {
                inputRef.current.value = address;
              }
              toast.success('Position actuelle récupérée');
          } catch (error) {
            console.error('❌ Erreur lors de la récupération de la position:', error);
          // Si le geocoder échoue, on garde juste les coordonnées
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setFormData(prev => ({
            ...prev,
            location: {
              address: fallbackAddress,
              coordinates: [latitude, longitude]
            }
          }));
          if (inputRef.current) {
            inputRef.current.value = fallbackAddress;
          }
          toast.warning('Adresse non trouvée, coordonnées utilisées');
        }
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        let message = 'Impossible de récupérer votre position';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permission de géolocalisation refusée';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position non disponible';
            break;
          case error.TIMEOUT:
            message = 'Délai d\'attente dépassé pour la géolocalisation';
            break;
        }
        
        toast.error(message);
      },
      options
    );
  };

  // Gérer l'upload de fichiers média
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      // Vérifications du fichier
      if (file.type.startsWith('image/')) {
        if (formData.mediaFiles.filter(f => f.type === 'image').length >= 3) {
          toast.error('Maximum 3 images autorisées');
          return;
        }
      } else if (file.type.startsWith('video/')) {
        if (formData.mediaFiles.some(f => f.type === 'video')) {
          toast.error('Une seule vidéo autorisée');
          return;
        }
        
        // Vérifier la durée de la vidéo
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          if (video.duration > 30) {
            toast.error('La vidéo ne peut pas dépasser 30 secondes');
            URL.revokeObjectURL(video.src);
            return;
          }
        };
      } else if (file.type.startsWith('audio/')) {
        if (formData.mediaFiles.some(f => f.type === 'audio')) {
          toast.error('Un seul fichier audio autorisé');
          return;
        }
        
        // Vérifier la durée de l'audio
        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
          if (audio.duration > 30) {
            toast.error('L\'audio ne peut pas dépasser 30 secondes');
            URL.revokeObjectURL(audio.src);
            return;
          }
        };
      } else {
        toast.error('Format de fichier non supporté');
        return;
      }

      // Vérifier que pas de vidéo/audio en même temps
      if ((file.type.startsWith('video/') && formData.mediaFiles.some(f => f.type === 'audio')) ||
          (file.type.startsWith('audio/') && formData.mediaFiles.some(f => f.type === 'video'))) {
        toast.error('Impossible de combiner vidéo et audio');
        return;
      }

      const mediaFile: MediaFile = {
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'audio'
      };

      setFormData(prev => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, mediaFile]
      }));
    });

    // Reset l'input
    event.target.value = '';
  };

  // Supprimer un fichier média
  const removeMediaFile = (index: number) => {
    const fileToRemove = formData.mediaFiles[index];
    URL.revokeObjectURL(fileToRemove.url);
    
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.category) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Veuillez saisir une description');
      return;
    }
    if (!formData.location.address.trim()) {
      toast.error('Veuillez saisir une adresse');
      return;
    }

    setLoading(true);

    try {
      const alertData = {
        category: formData.category,
        severity: formData.severity,
        description: formData.description,
        location: formData.location,
        mediaUrl: formData.mediaFiles.length > 0 ? formData.mediaFiles[0].url : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        source: getSourceFromChannel(),
        status: formData.status
      };

      const response = await createManualAlert(alertData);
      
      if (response.success) {
        toast.success('Signalement créé avec succès', {
          description: `Référence: ${response.data?.id || previewRef}`
        });
        
        // Nettoyer les URLs d'objets
        formData.mediaFiles.forEach(file => URL.revokeObjectURL(file.url));
        
        router.push('/dashboard/alerts');
      } else {
        toast.error('Erreur lors de la création', {
          description: response.error
        });
      }
    } catch (error) {
      toast.error('Erreur lors de la création du signalement');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6  mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb />
          <h1 className="text-3xl font-bold text-gray-900">Créer un signalement</h1>
          <p className="text-gray-600 mt-2">
            Création manuelle d'un nouveau signalement administrateur
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      {/* Aperçu de la référence */}
      {previewRef && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">Référence générée :</span>
              <Badge variant="outline" className="bg-white text-blue-800 border-blue-300">
                {previewRef}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Informations principales</span>
              </CardTitle>
              <CardDescription>
                Détails du signalement à créer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(INCIDENT_CATEGORIES).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Niveau de gravité *</Label>
                <Select value={formData.severity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full bg-green-500`}></span>
                        <span>Faible</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full bg-yellow-500`}></span>
                        <span>Moyenne</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full bg-orange-500`}></span>
                        <span>Élevée</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full bg-red-500`}></span>
                        <span>Critique</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.severity && (
                  <Badge className={`mt-2 ${getSeverityColor(formData.severity)}`}>
                    {formData.severity === 'critical' ? 'Critique' :
                     formData.severity === 'high' ? 'Élevée' :
                     formData.severity === 'medium' ? 'Moyenne' : 'Faible'}
                  </Badge>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez en détail le signalement..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Statut initial</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">✅ Actif</SelectItem>
                    <SelectItem value="pending">⏳ En attente de validation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Localisation</span>
            {!googleMapsLoaded && (
              <Badge variant="outline" className="ml-2">
                Chargement Google Maps...
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Lieu du signalement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Adresse *</Label>
            <div className="flex space-x-2 mt-1">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  id="address"
                  type="text"
                  placeholder={googleMapsLoaded ? "Rechercher une adresse..." : "Chargement de la recherche..."}
                  defaultValue={formData.location.address}
                  className="pr-10"
                  disabled={!googleMapsLoaded}
                  required
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={gettingLocation || !googleMapsLoaded}
                className="flex-shrink-0"
                title={!googleMapsLoaded ? "En attente du chargement de Google Maps" : "Utiliser ma position actuelle"}
              >
                {gettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            </div>
            {formData.location.coordinates[0] !== 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Coordonnées: {formData.location.coordinates[0].toFixed(6)}, {formData.location.coordinates[1].toFixed(6)}
              </p>
            )}
            {!googleMapsLoaded && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Chargement de Google Maps en cours. La recherche d'adresse sera disponible dans quelques instants.
              </p>
            )}
          </div>

          {/* ... reste de votre section localisation */}
        </CardContent>
      </Card>

        </div>

        {/* Médias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Médias</span>
            </CardTitle>
            <CardDescription>
              3 images maximum OU 1 vidéo/audio de 30s maximum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="relative">
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={handleMediaUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="media-upload"
                />
                <Button type="button" variant="outline" className="pointer-events-none">
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter des fichiers
                </Button>
              </div>
            </div>

            {/* Aperçu des médias */}
            {formData.mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.mediaFiles.map((mediaFile, index) => (
                  <div key={index} className="relative border rounded-lg overflow-hidden">
                    <Button
                      type="button"
                      onClick={() => removeMediaFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    {mediaFile.type === 'image' && (
                      <img
                        src={mediaFile.url}
                        alt={`Média ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    
                    {mediaFile.type === 'video' && (
                      <video
                        src={mediaFile.url}
                        className="w-full h-32 object-cover"
                        controls
                      />
                    )}
                    
                    {mediaFile.type === 'audio' && (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Mic className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <audio src={mediaFile.url} controls className="w-full" />
                        </div>
                      </div>
                    )}
                    
                    <div className="p-2 bg-gray-50 text-xs text-gray-600 truncate">
                      {mediaFile.file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créer le signalement
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}