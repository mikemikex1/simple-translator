import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { transcribeAudio } from '../services/speechService';
import { useAppStore } from '../store/useAppStore';

interface StopOptions {
  shouldTranscribe?: boolean;
}

export function useRecording() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sourceLang, apiKey } = useAppStore();
  const recordingRef = useRef<Audio.Recording | null>(null);

  async function startRecording() {
    setError(null);
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = rec;
    setRecording(rec);
  }

  async function stopRecording(options: StopOptions = {}): Promise<string | null> {
    const { shouldTranscribe = true } = options;
    const rec = recordingRef.current;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
    } catch {
      // Ignore stop race when recording is already stopped by lifecycle change.
    }
    recordingRef.current = null;
    setRecording(null);

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    if (!shouldTranscribe) return null;

    const uri = rec.getURI();
    if (!uri || !apiKey) return null;

    setTranscribing(true);
    try {
      return await transcribeAudio(uri, sourceLang, apiKey);
    } catch (e: any) {
      setError(e.message ?? 'Transcription failed');
      return null;
    } finally {
      setTranscribing(false);
    }
  }

  return { recording, transcribing, error, startRecording, stopRecording };
}
