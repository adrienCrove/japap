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


interface AlertDetailFormModalProps {
  visible: boolean;
  category: CategoryAlert | null;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
}

const { width, height } = Dimensions.get('window');

export default function AlertDetailFormModal({
  visible,
  category,
  onClose,
  onBack,
  onSuccess,
}: AlertDetailFormModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Form state
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<AlertLocation | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isHappeningNow, setIsHappeningNow] = useState(true);

  // Audio recording with expo-audio hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioRecorderState = useAudioRecorderState(audioRecorder);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission de localisation refusée', 'error');
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

      setLocation({
        address: addressStr,
        coordinates: {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        },
      });
    } catch (error) {
      console.error('Error getting location:', error);
      showToast('Erreur lors de la récupération de la position', 'error');
    }
  };

  useEffect(() => {
    if (visible && category) {
      getCurrentLocation();
    }
  }, [visible, category]);

  // Image picker handlers
  const handleImagePicker = () => {
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
    const image = await pickImageFromCamera();
    if (image) {
      setImageUri(image.uri);
      setUploadedImageUrl(null);
    }
  };

  const handlePickFromGallery = async () => {
    const image = await pickImageFromGallery();
    if (image) {
      setImageUri(image.uri);
      setUploadedImageUrl(null);
    }
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

  // Submit alert
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

      // Upload image if present
      let mediaUrl = uploadedImageUrl;
      if (imageUri && !uploadedImageUrl) {
        setLoadingMessage('Upload de l\'image...');
        const uploadResult = await uploadImage(imageUri);
        if (uploadResult.success && uploadResult.url) {
          mediaUrl = uploadResult.url;
          setUploadedImageUrl(uploadResult.url);
        }
      }

      // Create alert
      setLoadingMessage('Création de l\'alerte...');
      const alertData: CreateAlertData = {
        category: category.code,
        severity: category.defaultSeverity as any,
        title: category.name,
        description: description.trim(),
        location,
        mediaUrl: mediaUrl || undefined,
        userId: user.id,
        source: 'app',
      };

      const result = await createAlert(alertData);

      if (result.success) {
        showToast('Alerte créée avec succès !', 'success');
        // Reset form
        setTimeout(() => {
          setDescription('');
          setImageUri(null);
          setUploadedImageUrl(null);
          setIsHappeningNow(true);
          onSuccess();
        }, 1500);
      } else {
        showToast(result.error || 'Erreur lors de la création', 'error');
      }
    } catch (error: any) {
      console.error('Error submitting alert:', error);
      showToast(error.message || 'Erreur lors de la création', 'error');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  if (!category) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingModal visible={isLoading} message={loadingMessage || 'Chargement...'} />
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
            {/*<TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name="close" size={28} color={theme.colors.icon} />
            </TouchableOpacity>*/}
          </View>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Signalement de {category.name}</Text>
            <TouchableOpacity onPress={onBack} style={[styles.editButton, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.editButtonText, { color: theme.colors.primaryText }]}>Modifier</Text>
            </TouchableOpacity>
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

              {/* Mini Map */}
              {location?.coordinates ? (
                <View style={styles.mapContainer}>
                  <MiniMapView
                    latitude={location.coordinates.lat}
                    longitude={location.coordinates.lng}
                    markerColor={theme.colors.primary}
                    height={150}
                    borderRadius={12}
                  />
                </View>
              ) : (
                <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}>
                  <Ionicons name="map" size={40} color={theme.colors.icon} />
                  <Text style={[styles.mapPlaceholderText, { color: theme.colors.secondaryText }]}>Chargement de la position...</Text>
                </View>
              )}

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
                <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Détails</Text>
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

            {/* Photo Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>Photo (optionnel)</Text>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={[styles.removeImageButton, { backgroundColor: theme.colors.surface }]} onPress={() => setImageUri(null)}>
                    <Ionicons name="close-circle" size={32} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  testID="alert-photo-button"
                  style={[styles.photoButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={handleImagePicker}
                >
                  <Ionicons name="camera" size={28} color={theme.colors.primaryText} />
                  <Text style={[styles.photoButtonText, { color: theme.colors.primaryText }]}>Ajouter une photo</Text>
                </TouchableOpacity>
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
    width: '70%',
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
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 16,
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
