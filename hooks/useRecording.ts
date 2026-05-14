import { useState, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useAppStore } from '../store/useAppStore';
import type { Language } from '../store/useAppStore';

const LANG_CODE: Record<Language, string> = {
  af: 'af-ZA',
  ar: 'ar-SA',
  bg: 'bg-BG',
  bn: 'bn-BD',
  ca: 'ca-ES',
  cs: 'cs-CZ',
  da: 'da-DK',
  el: 'el-GR',
  et: 'et-EE',
  fa: 'fa-IR',
  fi: 'fi-FI',
  fil: 'fil-PH',
  he: 'he-IL',
  hi: 'hi-IN',
  hr: 'hr-HR',
  hu: 'hu-HU',
  id: 'id-ID',
  it: 'it-IT',
  lt: 'lt-LT',
  lv: 'lv-LV',
  ms: 'ms-MY',
  nl: 'nl-NL',
  no: 'no-NO',
  pl: 'pl-PL',
  ro: 'ro-RO',
  sk: 'sk-SK',
  sl: 'sl-SI',
  sr: 'sr-RS',
  sv: 'sv-SE',
  sw: 'sw-KE',
  ta: 'ta-IN',
  te: 'te-IN',
  th: 'th-TH',
  tr: 'tr-TR',
  uk: 'uk-UA',
  ur: 'ur-PK',
  zh: 'zh-TW',
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
  ko: 'ko-KR',
  pt: 'pt-PT',
  es: 'es-ES',
  ru: 'ru-RU',
  nan: 'zh-TW',
  fr: 'fr-FR',
  de: 'de-DE',
};

export function useRecording() {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const { sourceLang, useCloudSTT } = useAppStore();

  const resolveRef = useRef<((text: string | null) => void) | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const manualStopRef = useRef(false);
  const finalSegmentsRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const ignoreResultRef = useRef(false);
  const supportedLocalesRef = useRef<string[] | null>(null);
  const installedLocalesRef = useRef<string[] | null>(null);
  const STOP_RESULT_TIMEOUT_MS = 1200;

  function ensureSpeechModuleAvailable(): boolean {
    try {
      ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      return true;
    } catch {
      setError('Speech recognition native module is unavailable. Please use a development build.');
      return false;
    }
  }

  function normalize(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function appendFinalSegment(text: string) {
    const cleaned = normalize(text);
    if (!cleaned) return;

    const last = finalSegmentsRef.current[finalSegmentsRef.current.length - 1];
    if (last !== cleaned) {
      finalSegmentsRef.current.push(cleaned);
    }
  }

  function getCombinedText(): string {
    const interim = normalize(interimRef.current);
    const parts = [...finalSegmentsRef.current];
    if (interim) {
      const last = parts[parts.length - 1];
      if (last !== interim) parts.push(interim);
    }
    return normalize(parts.join(' '));
  }

  function resetCapture() {
    finalSegmentsRef.current = [];
    interimRef.current = '';
  }

  function pickBestLocale(locales: string[], preferred: string): string | null {
    if (!locales.length) return null;
    const preferredLower = preferred.toLowerCase();
    const exact = locales.find((l) => l.toLowerCase() === preferredLower);
    if (exact) return exact;

    const preferredBase = preferredLower.split('-')[0];
    const baseMatch = locales.find((l) => l.toLowerCase().split('-')[0] === preferredBase);
    if (baseMatch) return baseMatch;
    return null;
  }

  async function ensureLocaleCache() {
    if (supportedLocalesRef.current) return;

    try {
      const res = await ExpoSpeechRecognitionModule.getSupportedLocales({});
      supportedLocalesRef.current = res.locales ?? [];
      installedLocalesRef.current = res.installedLocales ?? [];
    } catch {
      supportedLocalesRef.current = [];
      installedLocalesRef.current = [];
    }
  }

  function resolvePending(text: string | null) {
    if (!resolveRef.current) return;
    resolveRef.current(text);
    resolveRef.current = null;
  }

  function clearStopTimeout() {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }

  useSpeechRecognitionEvent('result', (event) => {
    if (ignoreResultRef.current) return;

    const results = event.results ?? [];
    const latestResult = results[results.length - 1];
    const latestTranscript = latestResult?.transcript ?? '';

    if (event.isFinal) {
      appendFinalSegment(latestTranscript);
      interimRef.current = '';
    } else {
      interimRef.current = latestTranscript;
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (ignoreResultRef.current) {
      ignoreResultRef.current = false;
      clearStopTimeout();
      cancelledRef.current = false;
      manualStopRef.current = false;
      setListening(false);
      setTranscribing(false);
      resetCapture();
      return;
    }

    if (event.error === 'language-not-supported') {
      setError('The selected speech recognition language is not supported on this device.');
    } else {
      setError(event.message ?? 'Speech recognition error');
    }

    const finalText = cancelledRef.current ? null : getCombinedText() || null;
    if (resolveRef.current) {
      resolvePending(finalText);
    } else if (finalText && !manualStopRef.current) {
      setRecognizedText(finalText);
    }

    cancelledRef.current = false;
    manualStopRef.current = false;
    clearStopTimeout();
    setListening(false);
    setTranscribing(false);
    resetCapture();
  });

  useSpeechRecognitionEvent('end', () => {
    if (ignoreResultRef.current) {
      ignoreResultRef.current = false;
      clearStopTimeout();
      cancelledRef.current = false;
      manualStopRef.current = false;
      setListening(false);
      setTranscribing(false);
      resetCapture();
      return;
    }

    const finalText = cancelledRef.current ? null : getCombinedText() || null;
    if (resolveRef.current) {
      resolvePending(finalText);
    } else if (finalText && !manualStopRef.current) {
      setRecognizedText(finalText);
    }

    cancelledRef.current = false;
    manualStopRef.current = false;
    clearStopTimeout();
    setListening(false);
    setTranscribing(false);
    resetCapture();
  });

  async function startListening(): Promise<boolean> {
    clearStopTimeout();
    setError(null);
    setRecognizedText(null);
    cancelledRef.current = false;
    manualStopRef.current = false;
    ignoreResultRef.current = false;
    resetCapture();

    if (!ensureSpeechModuleAvailable()) {
      return false;
    }

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('Microphone permission is required.');
      return false;
    }

    await ensureLocaleCache();
    const preferredLang = LANG_CODE[sourceLang];
    const supportedLocales = supportedLocalesRef.current ?? [];
    const installedLocales = installedLocalesRef.current ?? [];
    const fallbackLang = sourceLang === 'zh' || sourceLang === 'nan' ? 'zh-TW' : 'en-US';

    let selectedLang =
      pickBestLocale(supportedLocales, preferredLang) ??
      pickBestLocale(supportedLocales, fallbackLang) ??
      preferredLang;

    const onDeviceSupported = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    const installedLang =
      pickBestLocale(installedLocales, selectedLang) ??
      pickBestLocale(installedLocales, fallbackLang);
    const useOnDevice = !useCloudSTT && onDeviceSupported && !!installedLang;
    if (useOnDevice && installedLang) {
      selectedLang = installedLang;
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: selectedLang,
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: useOnDevice,
      });
    } catch {
      try {
        ExpoSpeechRecognitionModule.start({
          lang: fallbackLang,
          interimResults: true,
          continuous: true,
        });
      } catch (e: any) {
        setError(e?.message ?? 'Failed to start speech recognition.');
        return false;
      }
    }
    setListening(true);
    return true;
  }

  async function stopListening(): Promise<string | null> {
    if (!listening) return null;
    const fallbackText = getCombinedText() || null;
    cancelledRef.current = false;
    manualStopRef.current = true;
    ignoreResultRef.current = false;
    setTranscribing(true);

    return new Promise((resolve) => {
      resolveRef.current = (text) => {
        clearStopTimeout();
        resolve(text ?? fallbackText);
      };

      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        resolvePending(getCombinedText() || fallbackText);
        setListening(false);
        setTranscribing(false);
        resetCapture();
        return;
      }

      stopTimeoutRef.current = setTimeout(() => {
        const timeoutText = getCombinedText() || fallbackText;
        ignoreResultRef.current = true;
        try {
          (ExpoSpeechRecognitionModule as any).abort?.();
        } catch {
          ExpoSpeechRecognitionModule.stop();
        }
        resolvePending(timeoutText);
        setListening(false);
        setTranscribing(false);
        resetCapture();
      }, STOP_RESULT_TIMEOUT_MS);
    });
  }

  function cancelTranscribing() {
    clearStopTimeout();
    cancelledRef.current = true;
    manualStopRef.current = true;
    setTranscribing(false);
    setRecognizedText(null);
    resolvePending(null);
    resetCapture();

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
