// Service simplifié pour la transcription audio uniquement
// L'enregistrement est géré directement dans le composant via useAudioRecorder

export { requestRecordingPermissionsAsync, useAudioRecorderState } from 'expo-audio';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
  return url.replace(/\/api$/, '');
};

const API_BASE_URL = getBaseUrl();

export interface AudioTranscriptionResult {
  success: boolean;
  text?: string;
  duration?: number;
  error?: string;
}

/**
 * Upload un fichier audio et le transcrit en utilisant l'API backend
 */
export async function transcribeAudio(audioUri: string, language: string = 'fr'): Promise<AudioTranscriptionResult> {
  try {
    console.log(`📤 Upload et transcription de: ${audioUri}`);

    // Créer FormData
    const formData = new FormData();

    // Extraire le nom du fichier
    const filename = audioUri.split('/').pop() || 'audio.m4a';

    // Déterminer le type MIME
    let mimeType = 'audio/m4a';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'mp3') mimeType = 'audio/mpeg';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'webm') mimeType = 'audio/webm';
    else if (ext === 'ogg') mimeType = 'audio/ogg';
    else if (ext === 'caf') mimeType = 'audio/x-caf'; // Format iOS

    // Ajouter le fichier au FormData
    formData.append('file', {
      uri: audioUri,
      name: filename,
      type: mimeType,
    } as any);

    // Ajouter la langue
    formData.append('language', language);

    console.log(`📡 Envoi vers: ${API_BASE_URL}/api/transcribe`);

    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    // Vérifier si la réponse est du JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Réponse non-JSON:', text.substring(0, 200));
      throw new Error('Le serveur a retourné une réponse invalide');
    }

    const data = await response.json();
    console.log('📥 Réponse serveur:', data);

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Erreur HTTP ${response.status}`);
    }

    return {
      success: true,
      text: data.text,
      duration: data.duration,
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de la transcription:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la transcription',
    };
  }
}

/**
 * Formate la durée en minutes:secondes
 */
export function formatDuration(milliseconds: number | undefined): string {
  if (milliseconds === undefined || milliseconds === null || isNaN(milliseconds)) {
    return '0:00';
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
