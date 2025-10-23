import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RichTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onLocationPress: () => void;
  onMicPress: () => void;
  onPhotoPress: () => void;
  onSendPress: () => void;
  images?: string[]; // Array d'URIs d'images
  onRemoveImage?: (index: number) => void;
  isRecording?: boolean;
  recordingDuration?: number;
  isTranscribing?: boolean;
  isSending?: boolean;
  disabled?: boolean;
  testID?: string;
  theme: any;
}

export default function RichTextInput({
  value,
  onChangeText,
  placeholder,
  onLocationPress,
  onMicPress,
  onPhotoPress,
  onSendPress,
  images = [],
  onRemoveImage,
  isRecording = false,
  recordingDuration = 0,
  isTranscribing = false,
  isSending = false,
  disabled = false,
  testID,
  theme,
}: RichTextInputProps) {
  const [inputHeight, setInputHeight] = useState(60);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation pulsante pour le bouton micro lors de l'enregistrement
  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Formater la durée d'enregistrement
  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Vérifier si le bouton Envoyer doit être activé
  const isSendEnabled = value.trim().length > 0 && !isRecording && !isTranscribing && !isSending;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {/* TextInput avec auto-expand */}
      <View style={[styles.textInputContainer, { minHeight: 60, maxHeight: 120 }]}>
        <TextInput
          testID={testID}
          style={[
            styles.textInput,
            {
              color: theme.colors.primaryText,
              height: Math.max(60, Math.min(inputHeight, 120)),
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.secondaryText}
          value={value}
          onChangeText={onChangeText}
          multiline
          textAlignVertical="top"
          editable={!isRecording && !isTranscribing && !disabled}
          onContentSizeChange={(event) => {
            setInputHeight(event.nativeEvent.contentSize.height);
          }}
        />
      </View>

      {/* Galerie d'images miniatures */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          style={styles.imagesGallery}
          contentContainerStyle={styles.imagesGalleryContent}
          showsHorizontalScrollIndicator={false}
        >
          {images.map((imageUri, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              {onRemoveImage && !disabled && (
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: theme.colors.surface }]}
                  onPress={() => onRemoveImage(index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Overlay de transcription */}
      {isTranscribing && (
        <View style={styles.transcribingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.transcribingText, { color: theme.colors.primaryText }]}>
            Transcription en cours...
          </Text>
        </View>
      )}

      {/* Barre d'outils */}
      <View style={[styles.toolbar, { borderTopColor: theme.colors.borderLight, backgroundColor: theme.colors.surfaceVariant }]}>
        {/* Bouton Localisation */}
        <TouchableOpacity
          testID={`${testID}-location-button`}
          style={styles.toolbarButton}
          onPress={onLocationPress}
          disabled={disabled || isRecording || isTranscribing || isSending}
          activeOpacity={0.6}
        >
          <Ionicons
            name="location"
            size={22}
            color={disabled || isRecording || isTranscribing || isSending ? theme.colors.icon : theme.colors.primaryText}
          />
        </TouchableOpacity>

        {/* Bouton Micro avec animation */}
        {!isRecording ? (
          <TouchableOpacity
            testID={`${testID}-mic-button`}
            style={styles.toolbarButton}
            onPress={onMicPress}
            disabled={disabled || isTranscribing || isSending}
            activeOpacity={0.6}
          >
            <Ionicons
              name="mic"
              size={22}
              color={disabled || isTranscribing || isSending ? theme.colors.icon : theme.colors.primaryText}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID={`${testID}-mic-button-recording`}
            style={[styles.toolbarButton, styles.recordingButton]}
            onPress={onMicPress}
            activeOpacity={0.6}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Bouton Photo */}
        <TouchableOpacity
          testID={`${testID}-photo-button`}
          style={styles.toolbarButton}
          onPress={onPhotoPress}
          disabled={disabled || isRecording || isTranscribing || isSending}
          activeOpacity={0.6}
        >
          <Ionicons
            name="camera"
            size={22}
            color={disabled || isRecording || isTranscribing || isSending ? theme.colors.icon : theme.colors.primaryText}
          />
        </TouchableOpacity>

        {/* Bouton Envoyer */}
        <TouchableOpacity
          testID={`${testID}-send-button`}
          style={[
            styles.toolbarButton,
            styles.sendButton,
            isSendEnabled && { backgroundColor: theme.colors.primary },
          ]}
          onPress={onSendPress}
          disabled={!isSendEnabled}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={isSendEnabled ? '#fff' : theme.colors.icon}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  textInputContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Lato',
    lineHeight: 22,
    padding: 0,
  },
  imagesGallery: {
    maxHeight: 90,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  imagesGalleryContent: {
    gap: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 75,
    height: 75,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: '#FEE2E2',
    width: 'auto',
    paddingHorizontal: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingTime: {
    fontSize: 13,
    fontFamily: 'Lato',
    fontWeight: '600',
    color: '#EF4444',
  },
  sendButton: {
    shadowColor: '#E94F23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  transcribingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  transcribingText: {
    fontSize: 14,
    fontFamily: 'Lato',
    fontWeight: '500',
  },
});
