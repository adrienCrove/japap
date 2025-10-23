import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createAlert, type CategoryAlert, type AlertLocation, type CreateAlertData } from '@/services/api';
import { pickImageFromGallery, pickImageFromCamera, uploadImage } from '@/services/imageUpload';
import { uploadMultipleImages, type UploadProgress } from '@/services/mediaUploadApi';
import { getLocationWithAddress } from '@/services/locationService';
import {
  transcribeAudio,
  formatDuration,
  requestRecordingPermissionsAsync,
  useAudioRecorderState,
} from '@/services/audioTranscription';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import LoadingModal from '@/components/LoadingModal';
import Toast from '@/components/Toast';
import MiniMapView from '@/components/map/MiniMapView';
import EnhancementLoadingModal from '@/components/EnhancementLoadingModal';
import { createAlertWithEnhancement, shouldEnhanceCategory } from '@/services/imageEnhancementApi';
import CategoryHelpModal from '@/components/CategoryHelpModal';
import { getCategoryByCode, type CategoryInfo } from '@/utils/categories';


interface AlertDetailFormModalProps {
  visible: boolean;
  category: CategoryAlert | null;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
  onAlertCreated?: (alert: any) => void; // Callback optionnel pour passer l'alerte créée
}

const { width, height } = Dimensions.get('window');

export default function AlertDetailFormModal({
  visible,
  category,
  onClose,
  onBack,
  onSuccess,
  onAlertCreated,
}: AlertDetailFormModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Form state
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<AlertLocation | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]); // Up to 3 images
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isHappeningNow, setIsHappeningNow] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Default coordinates: center of Côte d'Ivoire with wide view to show entire country
  const [mapCoordinates, setMapCoordinates] = useState({
    lat: 7.54,    // Centre de la Côte d'Ivoire
    lng: -5.55,   // Centre de la Côte d'Ivoire
    latitudeDelta: 6,  // Wide zoom to show entire Côte d'Ivoire (~600-700km)
    longitudeDelta: 6,
  });

  // Audio recording with expo-audio hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioRecorderState = useAudioRecorderState(audioRecorder);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgresses, setUploadProgresses] = useState<UploadProgress[]>([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  // Get current location with improved error handling
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(false);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission de localisation refusée', 'error');
        setIsLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const addressStr = address[0]
        ? `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`
        : 'Position actuelle';

      const newCoordinates = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      };

      setLocation({
        address: addressStr,
        coordinates: newCoordinates,
      });

      // Update map coordinates with precise zoom to trigger zoom in animation
      setMapCoordinates({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
        latitudeDelta: 0.002,  // Precise zoom (~200m)
        longitudeDelta: 0.002,
      });
      setIsLoadingLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      showToast('Erreur lors de la récupération de la position', 'error');
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (visible && category) {
      getCurrentLocation();
    }
  }, [visible, category]);

  // Image picker handlers - Multi-image support (max 3)
  const handleImagePicker = () => {
    if (imageUris.length >= 3) {
      showToast('Maximum 3 photos autorisées', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Prendre une photo', 'Choisir dans la galerie'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handlePickFromCamera();
          } else if (buttonIndex === 2) {
            await handlePickFromGallery();
          }
        }
      );
    } else {
      Alert.alert('Choisir une image', '', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Prendre une photo', onPress: handlePickFromCamera },
        { text: 'Galerie', onPress: handlePickFromGallery },
      ]);
    }
  };

  const handlePickFromCamera = async () => {
    if (imageUris.length >= 3) {
      showToast('Maximum 3 photos autorisées', 'error');
      return;
    }
    const image = await pickImageFromCamera();
    if (image) {
      setImageUris([...imageUris, image.uri]);
      setUploadedImageUrl(null);
    }
  };

  const handlePickFromGallery = async () => {
    if (imageUris.length >= 3) {
      showToast('Maximum 3 photos autorisées', 'error');
      return;
    }
    const image = await pickImageFromGallery();
    if (image) {
      setImageUris([...imageUris, image.uri]);
      setUploadedImageUrl(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
  };

  // Audio recording handlers
  const handleStartRecording = async () => {
    try {
      // Demander les permissions
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showToast('Permission microphone refusée', 'error');
        return;
      }

      console.log('🎙️ Démarrage de l\'enregistrement...');

      // Préparer et démarrer l'enregistrement
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      console.log('✅ Enregistrement démarré');
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('Erreur lors du démarrage de l\'enregistrement', 'error');
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('🛑 Arrêt de l\'enregistrement...');

      // Arrêter l'enregistrement
      await audioRecorder.stop();

      const uri = audioRecorder.uri;

      if (!uri) {
        showToast('Impossible de récupérer l\'enregistrement', 'error');
        return;
      }

      console.log(`✅ Enregistrement arrêté: ${uri}`);

      // Transcrire l'audio
      setIsTranscribing(true);
      setLoadingMessage('Transcription en cours...');

      const transcriptionResult = await transcribeAudio(uri, 'fr');

      if (transcriptionResult.success && transcriptionResult.text) {
        // Ajouter le texte transcrit à la description existante
        const newText = description
          ? `${description}\n${transcriptionResult.text}`
          : transcriptionResult.text;
        setDescription(newText);
        showToast('Transcription réussie !', 'success');
      } else {
        showToast(transcriptionResult.error || 'Erreur lors de la transcription', 'error');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      showToast('Erreur lors de l\'arrêt de l\'enregistrement', 'error');
    } finally {
      setIsTranscribing(false);
      setLoadingMessage('');
    }
  };

  const handleCancelRecording = async () => {
    try {
      console.log('❌ Annulation de l\'enregistrement');
      await audioRecorder.stop();
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  // Submit alert with multi-image support
  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      showToast('Veuillez entrer une description', 'error');
      return;
    }
    if (!location) {
      showToast('Localisation non disponible', 'error');
      return;
    }
    if (!category || !user) {
      showToast('Informations manquantes', 'error');
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Create alert first
      setLoadingMessage('Création de l\'alerte...');
      const alertData: CreateAlertData = {
        category: category.code,
        severity: category.defaultSeverity as any,
        title: category.name,
        description: description.trim(),
        location,
        userId: user.id,
        source: 'app',
      };

      const result = await createAlert(alertData);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      const alertId = result.data?.id;
      if (!alertId) {
        throw new Error('ID alerte introuvable');
      }

      // Appeler le callback avec l'alerte créée si fourni
      if (onAlertCreated && result.data) {
        onAlertCreated(result.data);
      }

      // Step 2: Upload images if present (new three-phase workflow)
      if (imageUris.length > 0) {
        setLoadingMessage(`Upload de ${imageUris.length} photo${imageUris.length > 1 ? 's' : ''}...`);

        try {
          await uploadMultipleImages(
            alertId,
            imageUris,
            (overallProgress, progresses) => {
              setUploadProgress(overallProgress);
              setUploadProgresses(progresses);

              // Update loading message with progress
              const completed = progresses.filter(p => p.phase === 'completed').length;
              const total = imageUris.length;
              setLoadingMessage(`Upload: ${completed}/${total} photo${total > 1 ? 's' : ''} (${overallProgress}%)`);
            }
          );

          // Check if category requires enhancement for success message
          const requiresEnhancement = shouldEnhanceCategory(category.code);
          let successMessage = 'Alerte créée avec succès !';

          if (requiresEnhancement && imageUris.length > 0) {
            successMessage = '✨ Alerte créée ! Les images seront améliorées en arrière-plan.';
          } else if (imageUris.length > 0) {
            successMessage = `Alerte créée avec ${imageUris.length} photo${imageUris.length > 1 ? 's' : ''} !`;
          }

          showToast(successMessage, 'success');
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          // Alert created but images failed - still show success with warning
          showToast('Alerte créée mais erreur upload images', 'error');
        }
      } else {
        showToast('Alerte créée avec succès !', 'success');
      }

      // Reset form
      setTimeout(() => {
        setDescription('');
        setImageUris([]);
        setUploadedImageUrl(null);
        setIsHappeningNow(true);
        setUploadProgress(0);
        setUploadProgresses([]);
        onSuccess();
      }, 1500);

      setIsLoading(false);
      setLoadingMessage('');
    } catch (error: any) {
      console.error('Error submitting alert:', error);
      showToast(error.message || 'Erreur lors de la création', 'error');
      setIsLoading(false);
      setLoadingMessage('');
      setIsEnhancing(false);
    }
  };

  if (!category) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingModal visible={isLoading} message={loadingMessage || 'Chargement...'} />
        <EnhancementLoadingModal visible={isEnhancing} />
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity testID="alert-back-button" onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.primaryText} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setShowHelpModal(true)}
                style={[styles.helpButton, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
          </View>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Signalement de {category.name}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onBack} style={[styles.editButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.editButtonText, { color: theme.colors.primaryText }]}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Location Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Localisation</Text>
              <View style={[styles.locationCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={24} color={theme.colors.primary} />
                  <Text
                    testID="alert-location-text"
                    style={[styles.locationText, { color: theme.colors.primaryText }]}
                  >
                    {location?.address || 'Chargement...'}
                  </Text>
                </View>
                <TouchableOpacity
                  testID="alert-location-button"
                  onPress={getCurrentLocation}
                  style={[styles.recenterButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Mini Map - Always visible with default location, then animates to actual position */}
              <View style={styles.mapContainer}>
                <MiniMapView
                  latitude={mapCoordinates.lat}
                  longitude={mapCoordinates.lng}
                  latitudeDelta={mapCoordinates.latitudeDelta}
                  longitudeDelta={mapCoordinates.longitudeDelta}
                  markerColor={theme.colors.primary}
                  height={150}
                  borderRadius={12}
                  isLoading={isLoadingLocation}
                />
              </View>

               {/* Time Section */}
              <View >
                <TouchableOpacity
                  style={[styles.timeSelector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => setIsHappeningNow(!isHappeningNow)}
                  activeOpacity={0.8}
                >
                  <View style={styles.timeSelectorContent}>
                    <Ionicons name="time" size={20} color={theme.colors.primaryText} />
                    <Text style={[styles.timeSelectorText, { color: theme.colors.primaryText }]}>
                      {isHappeningNow ? 'En ce moment' : 'À un autre moment'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Section 
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Moment</Text>
              <TouchableOpacity
                style={[styles.timeSelector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => setIsHappeningNow(!isHappeningNow)}
                activeOpacity={0.8}
              >
                <View style={styles.timeSelectorContent}>
                  <Ionicons name="time" size={20} color={theme.colors.primaryText} />
                  <Text style={[styles.timeSelectorText, { color: theme.colors.primaryText }]}>
                    {isHappeningNow ? 'En ce moment' : 'À un autre moment'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.colors.secondaryText} />
              </TouchableOpacity>
            </View>*/}

            {/* Details Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Description</Text>
                {/* Bouton micro */}
                {!audioRecorderState.isRecording ? (
                  <TouchableOpacity
                    testID="alert-record-button"
                    onPress={handleStartRecording}
                    style={[styles.micButton, { backgroundColor: theme.colors.primary }]}
                    disabled={isTranscribing}
                  >
                    <Ionicons name="mic" size={20} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.recordingControls}>
                    <View style={[styles.recordingIndicator, { backgroundColor: theme.colors.primary }]}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingTime}>{formatDuration(audioRecorderState.durationMillis)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleCancelRecording}
                      style={[styles.cancelButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    >
                      <Ionicons name="close" size={20} color={theme.colors.primaryText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleStopRecording}
                      style={[styles.stopButton, { backgroundColor: theme.colors.primary }]}
                    >
                      <Ionicons name="stop" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TextInput
                testID="alert-description-input"
                style={[styles.textArea, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.primaryText }]}
                placeholder="Partagez des détails supplémentaires..."
                placeholderTextColor={theme.colors.secondaryText}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!audioRecorderState.isRecording && !isTranscribing}
              />

              {isTranscribing && (
                <View style={styles.transcribingIndicator}>
                  <Text style={[styles.transcribingText, { color: theme.colors.secondaryText }]}>
                    Transcription en cours...
                  </Text>
                </View>
              )}
            </View>

            {/* Photo Section - Multi-image (max 3) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
                Photos (optionnel, max 3)
              </Text>
              <View style={styles.imagesContainer}>
                {/* Display existing images */}
                {imageUris.map((uri, index) => (
                  <View key={index} style={styles.imageSlot}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: theme.colors.surface }]}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close-circle" size={28} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <View style={[styles.imagePosition, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.imagePositionText}>{index + 1}</Text>
                    </View>
                  </View>
                ))}

                {/* Add image button - only show if less than 3 images */}
                {imageUris.length < 3 && (
                  <TouchableOpacity
                    testID="alert-photo-button"
                    style={[styles.addImageButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                    onPress={handleImagePicker}
                  >
                    <Ionicons name="add-circle" size={40} color={theme.colors.primaryText} />
                    <Text style={[styles.addImageButtonText, { color: theme.colors.secondaryText }]}>
                      {imageUris.length === 0 ? 'Ajouter' : 'Ajouter'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {imageUris.length > 0 && (
                <Text style={[styles.imageCountText, { color: theme.colors.secondaryText }]}>
                  {imageUris.length} / 3 photo{imageUris.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Button */}
        <View style={[styles.bottomContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.borderLight }]}>
          <TouchableOpacity
            testID="alert-submit-button"
            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.sendButtonText}>Envoyer</Text>
          </TouchableOpacity>
          <Text style={[styles.notificationText, { color: theme.colors.secondaryText }]}>Les utilisateurs à proximité seront notifiés</Text>
        </View>

        {/* Category Help Modal */}
        <CategoryHelpModal
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          category={getCategoryByCode(category.code) || null}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SUSE',
    flex: 1,
    width: '60%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Lato',
    fontWeight: '600',
  },
  content: {
    flex: 1,
        backgroundColor:'#FFF'
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'SUSE',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  // Audio recording styles
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E94F23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
  },
  recordingTime: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Lato',
    fontWeight: '600',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcribingIndicator: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  transcribingText: {
    fontSize: 14,
    fontFamily: 'Lato',
    fontStyle: 'italic',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato',
  },
  recenterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    marginTop: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 12,
  },
  mapPlaceholder: {
    height: 150,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mapPlaceholderText: {
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Lato',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  timeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeSelectorText: {
    fontSize: 16,
    fontFamily: 'Lato',
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    height: 120,
    fontFamily: 'Lato',
    textAlignVertical: 'top',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 16,
    fontFamily: 'Lato',
    fontWeight: '600',
  },
  // Multi-image styles
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageSlot: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    height:100,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 14,
    padding: 2,
  },
  imagePosition: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePositionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height:100,
  },
  addImageButtonText: {
    fontSize: 12,
    fontFamily: 'Lato',
  },
  imageCountText: {
    fontSize: 12,
    fontFamily: 'Lato',
    marginTop: 8,
    textAlign: 'right',
  },
  // Legacy styles (keep for compatibility)
  imagePreviewContainer: {
    position: 'relative',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E94F23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
  notificationText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'Lato',
  },
});
