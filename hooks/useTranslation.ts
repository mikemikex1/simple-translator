import { useState } from 'react';
import { translateText } from '../services/translateService';
import { useAppStore } from '../store/useAppStore';

export function useTranslation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sourceLang, targetLang, apiKey, addMessage } = useAppStore();

  async function translate(text: string): Promise<string | null> {
    if (!apiKey) {
      setError('OpenAI API Key 未設定');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await translateText(text, sourceLang, targetLang, apiKey);
      addMessage({
        id: Date.now().toString(),
        original: text,
        translated: result,
        fromLang: sourceLang,
        toLang: targetLang,
        timestamp: Date.now(),
      });
      return result;
    } catch (e: any) {
      setError(e.message ?? 'Translation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { translate, loading, error };
}
