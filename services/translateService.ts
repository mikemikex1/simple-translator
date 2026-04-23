import { Language } from '../store/useAppStore';

const MYMEMORY_LANG: Record<Language, string> = {
  zh: 'zh-TW',
  en: 'en',
  ja: 'ja',
};

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
): Promise<string> {
  const langpair = `${MYMEMORY_LANG[fromLang]}|${MYMEMORY_LANG[toLang]}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Translation error ${response.status}`);
  }

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails ?? 'Translation failed');
  }

  return data.responseData?.translatedText ?? '';
}
