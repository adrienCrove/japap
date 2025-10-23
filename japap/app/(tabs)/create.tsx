import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import LoadingModal from '@/components/LoadingModal';
import Toast from '@/components/Toast';
import AlertSuccessModal from '@/components/AlertSuccessModal';
import { createAlert, shareAlert, type CreateAlertData, type AlertLocation, type Alert as AlertType } from '@/services/api';
import { pickImageFromGallery, pickImageFromCamera, uploadImage } from '@/services/imageUpload';
import { getLocationWithAddress } from '@/services/locationService';

// Catégories d'alertes (vous pouvez les fetch depuis l'API categoryAlerts plus tard)
const ALERT_CATEGORIES = [
  { code: 'MEDC', name: 'Urgence médicale critique', icon: '🚑' },
  { code: 'ACCG', name: 'Accident grave circulation', icon: '🚗' },
  { code: 'FIRV', name: 'Incendie maison/immeuble', icon: '🔥' },
  { code: 'DISC', name: 'Disparition critique', icon: '🔍' },
  { code: 'CRIM', name: 'Criminalité grave', icon: '🚔' },
  { code: 'EVAU', name: 'Évacuation urgente', icon: '⚠️' },
  { code: 'ELEC', name: 'Panne électrique', icon: '⚡' },
  { code: 'FIR', name: 'Incendie domestique', icon: '🏠' },
  { code: 'ACCC', name: 'Accident circulation', icon: '🚙' },
  { code: 'MANV', name: 'Manifestation violente', icon: '🚧' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Faible', color: '#4CAF50' },
  { value: 'medium', label: 'Moyen', color: '#FF9800' },
  { value: 'high', label: 'Élevé', color: '#FF5722' },
  { value: 'critical', label: 'Critique', color: '#E94F23' },
];

export default function CreateScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // États du formulaire
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<AlertLocation | null>(null);

  // États UI
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAlert, setCreatedAlert] = useState<AlertType | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  const getCurrentLocation = async () => {
    try {
      console.log('🔄 Récupération de la localisation...');

      const result = await getLocationWithAddress();

      if (result.success && result.location) {
        setLocation(result.location);
        console.log('✅ Localisation récupérée avec succès');

        // Informer l'utilisateur si on utilise le fallback (coordonnées GPS)
        if (result.usedFallback) {
          showToast('Adresse non disponible, coordonnées GPS utilisées', 'success');
        }
      } else {
        // Échec complet de la récupération de la position
        console.error('❌ Échec de la récupération de la localisation:', result.error);
        showToast(result.error || 'Erreur lors de la récupération de la position', 'error');
      }
    } catch (error: any) {
      console.error('❌ Erreur inattendue lors de la récupération de la position:', error);
      showToast('Erreur lors de la récupération de la position', 'error');
    }
  };

  // Récupérer la localisation au chargement
  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setUploadedImageUrl(null); // Reset uploaded URL
    }
  };

  const handlePickFromGallery = async () => {
    const image = await pickImageFromGallery();
    if (image) {
      setImageUri(image.uri);
      setUploadedImageUrl(null); // Reset uploaded URL
    }
  };

  const handleShareAlert = async () => {
    if (!createdAlert) return;

    try {
      // Appel API pour marquer l'alerte comme partagée
      const result = await shareAlert(createdAlert.id);

      if (result.success) {
        showToast('Alerte partagée avec succès ! 🎉', 'success');

        // Rediriger vers la page des alertes après un court délai
        setTimeout(() => {
          router.push('/alerts');
        }, 1500);
      } else {
        showToast(result.error || 'Erreur lors du partage', 'error');
      }
    } catch (error) {
      console.error('Error sharing alert:', error);
      showToast('Erreur lors du partage', 'error');
    }
  };

  const handleDismissModal = () => {
    setShowSuccessModal(false);
    setCreatedAlert(null);

    // Rediriger directement vers la page des alertes
    router.push('/alerts');
  };

  const handleSubmit = async () => {
    // Vérifier l'authentification
    if (!isAuthenticated || !user) {
      Alert.alert('Authentification requise', 'Vous devez être connecté pour créer une alerte', [
        { text: 'OK', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    // Validation
    if (!category) {
      showToast('Veuillez sélectionner une catégorie', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Veuillez entrer un titre', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Veuillez entrer une description', 'error');
      return;
    }
    if (!location) {
      showToast('Localisation non disponible', 'error');
      return;
    }

    try {
      setIsLoading(true);

      // Upload de l'image si présente
      let mediaUrl = uploadedImageUrl;
      if (imageUri && !uploadedImageUrl) {
        setLoadingMessage('Upload de l\'image...');
        const uploadResult = await uploadImage(imageUri);
        if (uploadResult.success && uploadResult.url) {
          mediaUrl = uploadResult.url;
          setUploadedImageUrl(uploadResult.url);
        } else {
          showToast('Erreur lors de l\'upload de l\'image', 'error');
          // Continue sans image
        }
      }

      // Créer l'alerte
      setLoadingMessage('Création de l\'alerte...');
      const alertData: CreateAlertData = {
        category,
        severity,
        title: title.trim(),
        description: description.trim(),
        location,
        mediaUrl: mediaUrl || undefined,
        userId: user.id,
        source: 'mobile',
      };

      const result = await createAlert(alertData);

      if (result.success && result.data) {
        // Sauvegarder l'alerte créée et afficher la modal
        setCreatedAlert(result.data);
        setShowSuccessModal(true);

        // Reset formulaire
        setCategory('');
        setSeverity('medium');
        setTitle('');
        setDescription('');
        setImageUri(null);
        setUploadedImageUrl(null);
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.notAuthContainer}>
          <Ionicons name="lock-closed" size={80} color="#999" />
          <Text style={styles.notAuthTitle}>Authentification requise</Text>
          <Text style={styles.notAuthText}>Connectez-vous pour créer une alerte</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LoadingModal visible={isLoading} message={loadingMessage || 'Chargement...'} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
      <AlertSuccessModal
        visible={showSuccessModal}
        alertId={createdAlert?.ref_alert_id || ''}
        alertTitle={createdAlert?.title || ''}
        onShare={handleShareAlert}
        onDismiss={handleDismissModal}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Créer une alerte</Text>
            <Text style={styles.headerSubtitle}>Signalez un incident important</Text>
          </View>

          {/* Catégorie */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Catégorie <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {ALERT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.code}
                  style={[styles.categoryCard, category === cat.code && styles.categoryCardActive]}
                  onPress={() => setCategory(cat.code)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryText, category === cat.code && styles.categoryTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sévérité */}
          <View style={styles.section}>
            <Text style={styles.label}>Gravité</Text>
            <View style={styles.severityContainer}>
              {SEVERITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.severityButton,
                    severity === level.value && { backgroundColor: level.color },
                  ]}
                  onPress={() => setSeverity(level.value as any)}
                >
                  <Text
                    style={[
                      styles.severityText,
                      severity === level.value && styles.severityTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Titre */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Titre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Accident sur l'autoroute A1"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez l'incident en détail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Localisation */}
          <View style={styles.section}>
            <Text style={styles.label}>Localisation</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={24} color="#E94F23" />
              <Text style={styles.locationText}>{location?.address || 'Chargement...'}</Text>
              <TouchableOpacity onPress={getCurrentLocation}>
                <Ionicons name="refresh" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image */}
          <View style={styles.section}>
            <Text style={styles.label}>Photo (optionnel)</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                  <Ionicons name="close-circle" size={32} color="#E94F23" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
                <Ionicons name="camera" size={32} color="#666" />
                <Text style={styles.imagePickerText}>Ajouter une photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bouton Submit */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Créer l&apos;alerte</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'SUSE',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Lato',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'Lato-Bold',
  },
  required: {
    color: '#E94F23',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryCard: {
    width: 120,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  categoryCardActive: {
    borderColor: '#E94F23',
    backgroundColor: '#FFF5F5',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Lato',
  },
  categoryTextActive: {
    color: '#E94F23',
    fontWeight: '600',
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  severityText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Lato',
  },
  severityTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontFamily: 'Lato',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Lato',
  },
  imagePickerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Lato',
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
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E94F23',
    marginHorizontal: 24,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#E94F23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notAuthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 24,
    marginBottom: 8,
    fontFamily: 'SUSE',
  },
  notAuthText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Lato',
  },
  loginButton: {
    backgroundColor: '#E94F23',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
});
