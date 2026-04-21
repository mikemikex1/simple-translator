import OpenAI from 'openai';
import { Language } from '../store/useAppStore';

const LANG_NAMES: Record<Language, string> = {
  zh: 'Traditional Chinese',
  en: 'English',
  ja: 'Japanese',
};

let client: OpenAI | null = null;

function getClient(apiKey: string): OpenAI {
  if (!client || (client as any).apiKey !== apiKey) {
    client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
  apiKey: string,
): Promise<string> {
  const openai = getClient(apiKey);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a translator. Translate the user's text from ${LANG_NAMES[fromLang]} to ${LANG_NAMES[toLang]}. Output only the translated text, no explanations.`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content?.trim() ?? '';
}
