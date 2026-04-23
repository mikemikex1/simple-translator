import { useState, useEffect, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useAppStore } from '../store/useAppStore';
import type { Language } from '../store/useAppStore';

const LANG_CODE: Record<Language, string> = {
  zh: 'zh-TW',
  en: 'en-US',
  ja: 'ja-JP',
};

export function useRecording() {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sourceLang } = useAppStore();
  const resolveRef = useRef<((text: string | null) => void) | null>(null);
  const partialRef = useRef<string>('');

  useSpeechRecognitionEvent('result', (event) => {
    const best = event.results?.[0]?.transcript ?? '';
    partialRef.current = best;
    if (event.isFinal && resolveRef.current) {
      resolveRef.current(best || null);
      resolveRef.current = null;
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message ?? 'Speech recognition error');
    resolveRef.current?.(partialRef.current || null);
    resolveRef.current = null;
    setListening(false);
    setTranscribing(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    // Resolve with whatever partial text was captured if not yet resolved
    if (resolveRef.current) {
      resolveRef.current(partialRef.current || null);
      resolveRef.current = null;
    }
    setTranscribing(false);
  });

  async function startListening() {
    setError(null);
    partialRef.current = '';
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('需要麥克風權限');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: LANG_CODE[sourceLang],
      interimResults: true,
      continuous: false,
    });
    setListening(true);
  }

  async function stopListening(): Promise<string | null> {
    setTranscribing(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      ExpoSpeechRecognitionModule.stop();
    });
  }

  return { listening, transcribing, error, startListening, stopListening };
}
