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

import { getAllCategories, getCategoryByCode, calculateDynamicSeverity, getEmergencyServices } from '@/lib/enhanced-categories';
import { getFieldsForCategory, TrafficAccidentFields, TheftFields, DisappearanceFields, FireFields, MedicalEmergencyFields, InfrastructureFields } from '@/lib/enhanced-category-fields';
import { generateEnhancedAlertRef, enrichLocationData, calculateConfidenceScore, validateAlertData } from '@/lib/alert-enhancement-utils';
import type { EnhancedLocation, EnhancedAlertCreationData } from '@/lib/enhanced-alert-types';

interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio';
}

// Utilisation des types enrichis depuis enhanced-category-fields.ts
type CategorySpecificFields =
  | TrafficAccidentFields
  | TheftFields
  | DisappearanceFields
  | FireFields
  | MedicalEmergencyFields
  | InfrastructureFields
  | any
  | null;

interface AlertFormData {
  title: string;
  categoryCode: string; // Changed from category to categoryCode for clarity
  category: string; // Keep for display purposes
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: EnhancedLocation;
  mediaFiles: MediaFile[];
  expiresAt?: string;
  status: 'active' | 'pending';
  categorySpecificFields: CategorySpecificFields;
}                   

// Détection automatique de la source selon le canal
const getSourceFromChannel = (): 'app' | 'whatsapp' | 'telegram' | 'sms' | 'email' | 'web' => {
  // Dans un cas réel, ceci serait déterminé par l'authentification ou le canal d'accès
  // Pour l'instant, on retourne 'web' pour l'interface admin
  return 'web';
};

export default function CreateAlertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewRef] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({
    title: '',
    categoryCode: '',
    category: '',
    severity: 'medium',
    description: '',
    location: {
      address: '',
      coordinates: [0, 0],
      city: 'Yaoundé',
      region: 'Centre',
      isValidated: false,
      validationSource: 'manual'
    },
    mediaFiles: [],
    expiresAt: '',
    status: 'active',
    categorySpecificFields: null
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

          // Enrichir les données de localisation
          enrichLocationData(place.formatted_address || '', [lat, lng])
            .then(enrichedLocation => {
              setFormData(prev => ({
                ...prev,
                location: enrichedLocation
              }));
              console.log('✅ Location updated with enriched data:', enrichedLocation);
              toast.success('Adresse sélectionnée et enrichie');
            })
            .catch(error => {
              console.error('Error enriching location:', error);
              // Fallback vers localisation basique
              setFormData(prev => ({
                ...prev,
                location: {
                  address: place.formatted_address || '',
                  coordinates: [lat, lng],
                  city: 'Yaoundé',
                  region: 'Centre',
                  isValidated: true,
                  validationSource: 'google_places'
                }
              }));
              toast.success('Adresse sélectionnée');
            });
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



  // Initialiser les champs spécifiques selon la catégorie avec nouveau système
  const initializeCategoryFields = (categoryCode: string): CategorySpecificFields => {
    return getFieldsForCategory(categoryCode);
  };

  // Gérer le changement de catégorie avec nouveau système
  const handleCategoryChange = (categoryCode: string) => {
    const categoryDef = getCategoryByCode(categoryCode);
    if (categoryDef) {
      setFormData(prev => ({
        ...prev,
        categoryCode,
        category: categoryDef.name,
        severity: categoryDef.defaultSeverity,
        categorySpecificFields: initializeCategoryFields(categoryCode)
      }));
    }
  };

  // Mettre à jour les champs spécifiques
  const updateCategoryField = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      categorySpecificFields: prev.categorySpecificFields ? {
        ...prev.categorySpecificFields,
        [field]: value
      } : null
    }));
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

            // Enrichir les données de localisation
            enrichLocationData(address, [latitude, longitude])
              .then(enrichedLocation => {
                setFormData(prev => ({
                  ...prev,
                  location: enrichedLocation
                }));

                if (inputRef.current) {
                  inputRef.current.value = enrichedLocation.address;
                }
                toast.success('Position actuelle récupérée et enrichie');
              })
              .catch(error => {
                console.error('Error enriching current location:', error);
                // Fallback
                setFormData(prev => ({
                  ...prev,
                  location: {
                    address: address,
                    coordinates: [latitude, longitude],
                    city: 'Yaoundé',
                    region: 'Centre',
                    isValidated: true,
                    validationSource: 'gps'
                  }
                }));

                if (inputRef.current) {
                  inputRef.current.value = address;
                }
                toast.success('Position actuelle récupérée');
              });
          } catch (error) {
            console.error('❌ Erreur lors de la récupération de la position:', error);
          // Si le geocoder échoue, on garde juste les coordonnées
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setFormData(prev => ({
            ...prev,
            location: {
              address: fallbackAddress,
              coordinates: [latitude, longitude],
              city: 'Yaoundé',
              region: 'Centre',
              isValidated: false,
              validationSource: 'gps'
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

    // Validation enrichie
    const validationResult = validateAlertData(formData);
    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => toast.error(error));
      return;
    }

    // Validation supplémentaires spécifiques
    if (!formData.categoryCode) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }

    setLoading(true);

    try {
      // Générer une référence enrichie
      const category = getCategoryByCode(formData.categoryCode);
      const urgencyAssessment = calculateDynamicSeverity(
        formData.categoryCode,
        {
          hasVictims: formData.categorySpecificFields?.hasVictims || false,
          locationRisk: 'medium',
          timeOfDay: new Date().getHours() >= 6 && new Date().getHours() <= 18 ? 'day' : 'night',
          populationDensity: 'high'
        }
      );

      // Calculer le score de confiance
      const confidenceScore = calculateConfidenceScore(
        'medium', // trustLevel par défaut pour création manuelle
        formData.mediaFiles.length > 0,
        formData.location.precision,
        0 // pas de confirmations à la création
      );

      const alertData = {
        title: formData.title,
        ref_alert_id: generateEnhancedAlertRef(formData.category, urgencyAssessment === 'critical' ? 1 : urgencyAssessment === 'high' ? 2 : 3),
        category: formData.category,
        severity: urgencyAssessment,
        description: formData.description,
        location: formData.location,
        mediaUrl: formData.mediaFiles.length > 0 ? formData.mediaFiles[0].url : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        source: getSourceFromChannel(),
        status: formData.status,
        categorySpecificFields: formData.categorySpecificFields,
        confidenceScore
      };

      const response = await createManualAlert(alertData);
      
      if (response.success) {
        toast.success('Signalement créé avec succès', {
          description: `Référence: ${response.data?.ref_alert_id}`
        });
        
        // Nettoyer les URLs d'objets
        formData.mediaFiles.forEach(file => URL.revokeObjectURL(file.url));
        
        router.push('/dashboard/alerts');
      } else {
        toast.error('Erreur lors de la création', {
          description: response.error
        });
      }
    } catch {
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

  // Rendu des champs spécifiques par catégorie
  const renderCategorySpecificFields = () => {
    if (!formData.categoryCode || !formData.categorySpecificFields) return null;

    const fields = formData.categorySpecificFields;
    const category = getCategoryByCode(formData.categoryCode);
    if (!category) return null;

    // Utiliser le code de catégorie pour déterminer le rendu
    switch (formData.categoryCode) {
      case 'ACCG':
      case 'ACCL':
        const accidentFields = fields as TrafficAccidentFields;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🚗</span>
                <span>Détails de l&apos;accident</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="severity">Gravité de l&apos;accident</Label>
                <Select value={accidentFields.severity} onValueChange={(value) => updateCategoryField('severity', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner la gravité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materiel">Matériel seulement</SelectItem>
                    <SelectItem value="leger">Léger</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                    <SelectItem value="mortel">Mortel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasVictims"
                  checked={accidentFields.casualties?.hasVictims || false}
                  onChange={(e) => updateCategoryField('casualties', { ...accidentFields.casualties, hasVictims: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="hasVictims">Il y a des victimes</Label>
              </div>

              {accidentFields.casualties?.hasVictims && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="victimCount">Nombre total</Label>
                    <Input
                      id="victimCount"
                      type="number"
                      min="0"
                      value={accidentFields.casualties.victimCount}
                      onChange={(e) => updateCategoryField('casualties', { ...accidentFields.casualties, victimCount: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serious">Blessés graves</Label>
                    <Input
                      id="serious"
                      type="number"
                      min="0"
                      value={accidentFields.casualties.serious}
                      onChange={(e) => updateCategoryField('casualties', { ...accidentFields.casualties, serious: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deaths">Décès</Label>
                    <Input
                      id="deaths"
                      type="number"
                      min="0"
                      value={accidentFields.casualties.deaths}
                      onChange={(e) => updateCategoryField('casualties', { ...accidentFields.casualties, deaths: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="roadBlocked"
                  checked={accidentFields.trafficImpact?.roadBlocked || false}
                  onChange={(e) => updateCategoryField('trafficImpact', { ...accidentFields.trafficImpact, roadBlocked: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="roadBlocked">Route bloquée</Label>
              </div>
            </CardContent>
          </Card>
        );

      case 'ASGC':
      case 'ASS':
      case 'VOL':
        const theftFields = fields as TheftFields;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🥷</span>
                <span>Détails de l&apos;incident</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theftType">Type d&apos;incident</Label>
                <Select value={theftFields.theftType} onValueChange={(value) => updateCategoryField('theftType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vol_main_armee">Vol à main armée</SelectItem>
                    <SelectItem value="pickpocket">Pickpocket</SelectItem>
                    <SelectItem value="vol_vehicule">Vol de véhicule</SelectItem>
                    <SelectItem value="cambriolage_domicile">Cambriolage domicile</SelectItem>
                    <SelectItem value="cambriolage_commerce">Cambriolage commerce</SelectItem>
                    <SelectItem value="vol_portable">Vol portable</SelectItem>
                    <SelectItem value="vol_moto">Vol moto</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="locationType">Type de lieu</Label>
                <Select value={theftFields.location?.locationType} onValueChange={(value) => updateCategoryField('location', { ...theftFields.location, locationType: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner le lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domicile">Domicile</SelectItem>
                    <SelectItem value="commerce">Commerce</SelectItem>
                    <SelectItem value="rue">Rue</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="marche">Marché</SelectItem>
                    <SelectItem value="ecole">École</SelectItem>
                    <SelectItem value="bureau">Bureau</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="weaponUsed"
                  checked={theftFields.weapon?.weaponUsed || false}
                  onChange={(e) => updateCategoryField('weapon', { ...theftFields.weapon, weaponUsed: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="weaponUsed">Arme utilisée</Label>
              </div>

              {theftFields.weapon?.weaponUsed && (
                <div>
                  <Label htmlFor="weaponType">Type d&apos;arme</Label>
                  <Select value={theftFields.weapon.weaponType} onValueChange={(value) => updateCategoryField('weapon', { ...theftFields.weapon, weaponType: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner l'arme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arme_feu">Arme à feu</SelectItem>
                      <SelectItem value="couteau">Couteau</SelectItem>
                      <SelectItem value="machette">Machette</SelectItem>
                      <SelectItem value="baton">Bâton</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="suspectsFled"
                  checked={theftFields.suspects?.fled || false}
                  onChange={(e) => updateCategoryField('suspects', { ...theftFields.suspects, fled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="suspectsFled">Suspect(s) en fuite</Label>
              </div>

              <div>
                <Label htmlFor="suspectCount">Nombre de suspects</Label>
                <Input
                  id="suspectCount"
                  type="number"
                  min="1"
                  value={theftFields.suspects?.count || 1}
                  onChange={(e) => updateCategoryField('suspects', { ...theftFields.suspects, count: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'DISC':
      case 'DIS':
        const disparitionFields = fields as DisappearanceFields;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>👤</span>
                <span>Détails de la personne disparue</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type de recherche */}
              <div>
                <Label htmlFor="searchType">Type d&apos;avis</Label>
                <Select value={disparitionFields.searchType} onValueChange={(value) => updateCategoryField('searchType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="missing">Personne disparue</SelectItem>
                    <SelectItem value="wanted">Avis de recherche</SelectItem>
                    <SelectItem value="runaway">Fugue</SelectItem>
                    <SelectItem value="lost_child">Enfant perdu</SelectItem>
                    <SelectItem value="alzheimer">Alzheimer/Démence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message d'urgence personnalisé */}
              <div>
                <Label htmlFor="urgencyMessage">Message d&apos;urgence (optionnel)</Label>
                <Textarea
                  id="urgencyMessage"
                  placeholder="Ex: Nous recherchons désespérément notre fille..."
                  value={disparitionFields.urgencyMessage}
                  onChange={(e) => updateCategoryField('urgencyMessage', e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              {/* Informations personnelles */}
              <div>
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  placeholder="Nom et prénom..."
                  value={disparitionFields.person?.fullName}
                  onChange={(e) => updateCategoryField('person', { ...disparitionFields.person, fullName: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Âge</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="120"
                    value={disparitionFields.person?.age}
                    onChange={(e) => updateCategoryField('person', { ...disparitionFields.person, age: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Genre</Label>
                  <Select value={disparitionFields.person?.gender} onValueChange={(value) => updateCategoryField('person', { ...disparitionFields.person, gender: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homme">Homme</SelectItem>
                      <SelectItem value="femme">Femme</SelectItem>
                      <SelectItem value="enfant">Enfant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Circonstances */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastSeenDate">Date de disparition</Label>
                  <Input
                    id="lastSeenDate"
                    type="date"
                    value={disparitionFields.circumstances?.lastSeenDate}
                    onChange={(e) => updateCategoryField('circumstances', { ...disparitionFields.circumstances, lastSeenDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastSeenTime">Heure de disparition</Label>
                  <Input
                    id="lastSeenTime"
                    type="time"
                    value={disparitionFields.circumstances?.lastSeenTime}
                    onChange={(e) => updateCategoryField('circumstances', { ...disparitionFields.circumstances, lastSeenTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lastSeenLocation">Dernière localisation connue</Label>
                <Input
                  id="lastSeenLocation"
                  placeholder="Dernier endroit où la personne a été vue..."
                  value={disparitionFields.circumstances?.lastSeenLocation}
                  onChange={(e) => updateCategoryField('circumstances', { ...disparitionFields.circumstances, lastSeenLocation: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="physicalDescription">Description physique</Label>
                <Textarea
                  id="physicalDescription"
                  placeholder="Taille, corpulence, couleur de cheveux, signes distinctifs..."
                  value={disparitionFields.physicalDescription?.distinguishingMarks}
                  onChange={(e) => updateCategoryField('physicalDescription', { ...disparitionFields.physicalDescription, distinguishingMarks: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="clothingDescription">Vêtements portés</Label>
                <Textarea
                  id="clothingDescription"
                  placeholder="Description des vêtements lors de la disparition..."
                  value={disparitionFields.lastClothing?.description}
                  onChange={(e) => updateCategoryField('lastClothing', { ...disparitionFields.lastClothing, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Numéros de contact pour signalement */}
              <div>
                <Label>Numéros à contacter pour signaler (famille/autorités)</Label>
                <div className="space-y-2 mt-2">
                  {(disparitionFields.contactNumbers || []).map((contact, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Numéro (ex: 693136789)"
                        value={contact.phone}
                        onChange={(e) => {
                          const newContacts = [...(disparitionFields.contactNumbers || [])];
                          newContacts[index] = { ...contact, phone: e.target.value };
                          updateCategoryField('contactNumbers', newContacts);
                        }}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Propriétaire"
                        value={contact.owner}
                        onChange={(e) => {
                          const newContacts = [...(disparitionFields.contactNumbers || [])];
                          newContacts[index] = { ...contact, owner: e.target.value };
                          updateCategoryField('contactNumbers', newContacts);
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newContacts = (disparitionFields.contactNumbers || []).filter((_, i) => i !== index);
                          updateCategoryField('contactNumbers', newContacts);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newContacts = [...(disparitionFields.contactNumbers || []), { phone: '', owner: '' }];
                      updateCategoryField('contactNumbers', newContacts);
                    }}
                  >
                    + Ajouter un numéro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'MEDC':
      case 'MED':
        const medicalFields = fields as MedicalEmergencyFields;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🩺</span>
                <span>Détails de l&apos;urgence médicale</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergencyType">Type d&apos;urgence</Label>
                <Select value={medicalFields.emergencyType} onValueChange={(value) => updateCategoryField('emergencyType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="malaise">Malaise</SelectItem>
                    <SelectItem value="crise_cardiaque">Crise cardiaque</SelectItem>
                    <SelectItem value="crise_epilepsie">Crise d&apos;épilepsie</SelectItem>
                    <SelectItem value="blessure_grave">Blessure grave</SelectItem>
                    <SelectItem value="intoxication">Intoxication</SelectItem>
                    <SelectItem value="noyade">Noyade</SelectItem>
                    <SelectItem value="brulure">Brûlure</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="victimCount">Nombre de victimes</Label>
                <Input
                  id="victimCount"
                  type="number"
                  min="1"
                  value={medicalFields.victimCount}
                  onChange={(e) => updateCategoryField('victimCount', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="consciousness">État de conscience</Label>
                <Select value={medicalFields.consciousness} onValueChange={(value) => updateCategoryField('consciousness', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner l'état" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conscient">Conscient</SelectItem>
                    <SelectItem value="semi_conscient">Semi-conscient</SelectItem>
                    <SelectItem value="inconscient">Inconscient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="breathing">Respiration</Label>
                <Select value={medicalFields.breathing} onValueChange={(value) => updateCategoryField('breathing', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="État respiratoire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="difficile">Difficile</SelectItem>
                    <SelectItem value="arretee">Arrêtée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bleeding"
                  checked={medicalFields.bleeding || false}
                  onChange={(e) => updateCategoryField('bleeding', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="bleeding">Saignement visible</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ambulanceNeeded"
                  checked={medicalFields.ambulanceNeeded || false}
                  onChange={(e) => updateCategoryField('ambulanceNeeded', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="ambulanceNeeded">Ambulance nécessaire</Label>
              </div>
            </CardContent>
          </Card>
        );

      case 'FIRV':
      case 'FIR':
      case 'FORF':
        const fireFields = fields as FireFields;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔥</span>
                <span>Détails de l&apos;incendie</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fireType">Type d&apos;incendie</Label>
                <Select value={fireFields.fireType} onValueChange={(value) => updateCategoryField('fireType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestique">Domestique</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industriel">Industriel</SelectItem>
                    <SelectItem value="vehicule">Véhicule</SelectItem>
                    <SelectItem value="foret">Forêt</SelectItem>
                    <SelectItem value="brousse">Brousse</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Ampleur du feu</Label>
                <Select value={fireFields.extent?.size} onValueChange={(value) => updateCategoryField('extent', { ...fireFields.extent, size: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner l'ampleur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petit">Petit</SelectItem>
                    <SelectItem value="moyen">Moyen</SelectItem>
                    <SelectItem value="grand">Grand</SelectItem>
                    <SelectItem value="majeur">Majeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasVictims"
                  checked={fireFields.casualties?.hasVictims || false}
                  onChange={(e) => updateCategoryField('casualties', { ...fireFields.casualties, hasVictims: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="hasVictims">Il y a des victimes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fireServiceCalled"
                  checked={fireFields.response?.fireServiceCalled || false}
                  onChange={(e) => updateCategoryField('response', { ...fireFields.response, fireServiceCalled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="fireServiceCalled">Pompiers contactés</Label>
              </div>
            </CardContent>
          </Card>
        );

      case 'AUT':
        const autreFields = fields as any; // Flexible type for other categories
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>❓</span>
                <span>Détails spécifiques</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customType">Type personnalisé</Label>
                <Input
                  id="customType"
                  placeholder="Spécifiez le type d'incident..."
                  value={autreFields.customType}
                  onChange={(e) => updateCategoryField('customType', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="specificDetails">Détails spécifiques</Label>
                <Textarea
                  id="specificDetails"
                  placeholder="Informations détaillées sur l'incident..."
                  value={autreFields.specificDetails}
                  onChange={(e) => updateCategoryField('specificDetails', e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        );

      // Autres catégories avec formulaire générique
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{category.icon}</span>
                <span>Détails spécifiques - {category.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="specificDetails">Détails supplémentaires</Label>
                <Textarea
                  id="specificDetails"
                  placeholder="Informations spécifiques à cette catégorie..."
                  value={fields?.specificDetails || ''}
                  onChange={(e) => updateCategoryField('specificDetails', e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        );
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
            Création manuelle d&apos;un nouveau signalement administrateur
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>



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


              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.categoryCode} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {/* Urgences Vitales */}
                    <div className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50">🔴 URGENCES VITALES</div>
                    {getAllCategories().filter(cat => cat.priority === 'critical').map((category) => (
                      <SelectItem key={category.code} value={category.code} className="text-red-700">
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                          <span className="text-xs text-gray-500">({category.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Urgences Sécuritaires */}
                    <div className="px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-50 mt-2">🟠 URGENCES SÉCURITAIRES</div>
                    {getAllCategories().filter(cat => cat.priority === 'high').map((category) => (
                      <SelectItem key={category.code} value={category.code} className="text-orange-700">
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                          <span className="text-xs text-gray-500">({category.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Alertes Communautaires */}
                    <div className="px-2 py-1 text-xs font-semibold text-yellow-600 bg-yellow-50 mt-2">🟡 ALERTES COMMUNAUTAIRES</div>
                    {getAllCategories().filter(cat => cat.priority === 'medium').map((category) => (
                      <SelectItem key={category.code} value={category.code} className="text-yellow-700">
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                          <span className="text-xs text-gray-500">({category.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Informations Publiques */}
                    <div className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-50 mt-2">🟢 INFORMATIONS PUBLIQUES</div>
                    {getAllCategories().filter(cat => cat.priority === 'low').map((category) => (
                      <SelectItem key={category.code} value={category.code} className="text-green-700">
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                          <span className="text-xs text-gray-500">({category.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Informations sur la catégorie sélectionnée */}
              
              </div>
                <div>
                  <Label htmlFor="severity">Niveau de gravité *</Label>
                  <Select value={formData.severity} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData(prev => ({ ...prev, severity: value }))}>
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
                  {/*formData.severity && (
                    <Badge className={`mt-2 ${getSeverityColor(formData.severity)}`}>
                      {formData.severity === 'critical' ? 'Critique' :
                      formData.severity === 'high' ? 'Élevée' :
                      formData.severity === 'medium' ? 'Moyenne' : 'Faible'}
                    </Badge>
                  )*/}
                </div>
              </div>
              <div>
              {formData.categoryCode && (() => {
                  const selectedCategory = getCategoryByCode(formData.categoryCode);
                  return selectedCategory ? (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium" style={{color: selectedCategory.color}}>
                          {selectedCategory.icon} {selectedCategory.name}
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{selectedCategory.code}</span>
                      </div>
                      <p className="text-gray-600 text-xs">{selectedCategory.description}</p>
                      <p className="text-xs mt-1">
                        <span className="font-medium">Temps d&apos;intervention:</span> {selectedCategory.responseTime} min
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedCategory.emergencyServices.map(service => (
                          <span key={service} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <Label htmlFor="title">Titre du signalement</Label>
                <Input
                  id="title"
                  placeholder="Titre du signalement"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
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

          {/* Champs spécifiques par catégorie */}
          {renderCategorySpecificFields()}

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
                ⚠️ Chargement de Google Maps en cours. La recherche d&apos;adresse sera disponible dans quelques instants.
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