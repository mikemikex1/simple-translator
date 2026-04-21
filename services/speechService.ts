import OpenAI from 'openai';
import { Language } from '../store/useAppStore';

const WHISPER_LANG: Record<Language, string> = {
  zh: 'zh',
  en: 'en',
  ja: 'ja',
};

export async function transcribeAudio(
  audioUri: string,
  language: Language,
  apiKey: string,
): Promise<string> {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  formData.append('model', 'whisper-1');
  formData.append('language', WHISPER_LANG[language]);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Whisper error: ${response.status}`);
  const data = await response.json();
  return data.text?.trim() ?? '';
}
