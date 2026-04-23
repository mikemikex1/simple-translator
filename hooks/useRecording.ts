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
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const { sourceLang } = useAppStore();
  const resolveRef = useRef<((text: string | null) => void) | null>(null);
  const partialRef = useRef<string>('');
  const cancelledRef = useRef(false);

  function resolvePending(text: string | null) {
    if (!resolveRef.current) return;
    resolveRef.current(text);
    resolveRef.current = null;
  }

  useSpeechRecognitionEvent('result', (event) => {
    const best = event.results?.[0]?.transcript ?? '';
    partialRef.current = best;
    if (event.isFinal && resolveRef.current) {
      resolvePending(best || null);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message ?? 'Speech recognition error');
    const finalText = cancelledRef.current ? null : partialRef.current || null;
    if (resolveRef.current) {
      resolvePending(finalText);
    } else if (finalText) {
      setRecognizedText(finalText);
    }
    cancelledRef.current = false;
    setListening(false);
    setTranscribing(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    // Resolve with whatever partial text was captured if not yet resolved
    const finalText = cancelledRef.current ? null : partialRef.current || null;
    if (resolveRef.current) {
      resolvePending(finalText);
    } else if (finalText) {
      setRecognizedText(finalText);
    }
    cancelledRef.current = false;
    setTranscribing(false);
  });

  async function startListening() {
    setError(null);
    partialRef.current = '';
    setRecognizedText(null);
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('需要麥克風權限');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: LANG_CODE[sourceLang],
      interimResults: true,
      continuous: true,
    });
    setListening(true);
  }

  async function stopListening(): Promise<string | null> {
    if (!listening) return null;
    cancelledRef.current = false;
    setTranscribing(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      ExpoSpeechRecognitionModule.stop();
    });
  }

  function cancelTranscribing() {
    cancelledRef.current = true;
    setTranscribing(false);
    resolvePending(null);
    setRecognizedText(null);
    try {
      (ExpoSpeechRecognitionModule as any).abort?.();
    } catch {
      ExpoSpeechRecognitionModule.stop();
    }
  }

  function clearRecognizedText() {
    setRecognizedText(null);
  }

  return {
    listening,
    transcribing,
    error,
    recognizedText,
    startListening,
    stopListening,
    cancelTranscribing,
    clearRecognizedText,
  };
}
