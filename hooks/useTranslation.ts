import { useState } from 'react';
import * as Speech from 'expo-speech';
import { translateText } from '../services/translateService';
import { useAppStore } from '../store/useAppStore';
import type { Language } from '../store/useAppStore';

const FAST_MODE = false;
const SPEAK_TIMEOUT_MS = 15000;

const TTS_LANG: Record<Language, string> = {
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

export function useTranslation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sourceLang, targetLang, addMessage } = useAppStore();

  async function speakWithTiming(text: string, lang: Language): Promise<number> {
    const startedAt = Date.now();
    return new Promise((resolve) => {
      let settled = false;
      const resolveOnce = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(Date.now() - startedAt);
      };

      const timeoutId = setTimeout(() => {
        try {
          Speech.stop();
        } catch {
          // noop
        }
        resolveOnce();
      }, SPEAK_TIMEOUT_MS);

      Speech.speak(text, {
        language: TTS_LANG[lang],
        rate: 1.0,
        onDone: resolveOnce,
        onStopped: resolveOnce,
        onError: resolveOnce,
      });
    });
  }

  async function speakTextWithTiming(text: string, lang: Language): Promise<number> {
    if (!text?.trim()) return 0;
    return speakWithTiming(text, lang);
  }

  async function translateWithMetrics(
    text: string,
    options?: { fromLang?: Language; toLang?: Language; speak?: boolean },
  ): Promise<{ translated: string | null; translationMs: number; ttsMs: number }> {
    const fromLang = options?.fromLang ?? sourceLang;
    const toLang = options?.toLang ?? targetLang;
    const speak = options?.speak ?? !FAST_MODE;

    setLoading(true);
    setError(null);
    try {
      const t0 = Date.now();
      const result = await translateText(text, fromLang, toLang);
      const translationMs = Date.now() - t0;
      let ttsMs = 0;

      addMessage({
        id: Date.now().toString(),
        original: text,
        translated: result,
        fromLang,
        toLang,
        timestamp: Date.now(),
      });

      if (result && speak) {
        ttsMs = await speakWithTiming(result, toLang);
      }

      return { translated: result, translationMs, ttsMs };
    } catch (e: any) {
      setError(e.message ?? 'Translation failed');
      return { translated: null, translationMs: 0, ttsMs: 0 };
    } finally {
      setLoading(false);
    }
  }

  async function translate(
    text: string,
    options?: { fromLang?: Language; toLang?: Language },
  ): Promise<string | null> {
    const res = await translateWithMetrics(text, { ...options, speak: !FAST_MODE });
    return res.translated;
  }

  return { translate, translateWithMetrics, speakTextWithTiming, loading, error };
}
