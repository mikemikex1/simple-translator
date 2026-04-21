import { Language } from '../store/useAppStore';

const LANG_NAMES: Record<Language, string> = {
  zh: 'Traditional Chinese',
  en: 'English',
  ja: 'Japanese',
};

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
  apiKey: string,
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a translator. Translate the user's text from ${LANG_NAMES[fromLang]} to ${LANG_NAMES[toLang]}. Output only the translated text, no explanations.`,
        },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}
