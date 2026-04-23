import { Language } from '../store/useAppStore';

const MYMEMORY_LANG: Record<Language, string> = {
  zh: 'zh-TW',
  en: 'en',
  ja: 'ja',
  vi: 'vi',
  ko: 'ko',
  pt: 'pt',
  es: 'es',
  ru: 'ru',
  nan: 'zh-TW',
  fr: 'fr',
  de: 'de',
};

const MAX_CHUNK_LENGTH = 180;
const translationCache = new Map<string, string>();
const MYMEMORY_EMAIL = (process.env.EXPO_PUBLIC_MYMEMORY_EMAIL ?? '').trim();

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function buildCacheKey(text: string, fromLang: Language, toLang: Language): string {
  return `${fromLang}->${toLang}:${text}`;
}

function splitByMaxLength(text: string, maxLen: number): string[] {
  const clean = normalizeText(text);
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentenceParts = clean
    .split(/(?<=[.!?。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: string[] = [];
  let current = '';

  for (const part of sentenceParts.length > 0 ? sentenceParts : [clean]) {
    if (!current) {
      current = part;
      continue;
    }

    if (`${current} ${part}`.length <= maxLen) {
      current = `${current} ${part}`;
    } else {
      result.push(current);
      current = part;
    }
  }

  if (current) result.push(current);

  const finalChunks: string[] = [];
  for (const chunk of result) {
    if (chunk.length <= maxLen) {
      finalChunks.push(chunk);
      continue;
    }
    for (let i = 0; i < chunk.length; i += maxLen) {
      finalChunks.push(chunk.slice(i, i + maxLen));
    }
  }
  return finalChunks;
}

async function translateChunk(
  chunk: string,
  fromLang: Language,
  toLang: Language,
): Promise<string> {
  const key = buildCacheKey(chunk, fromLang, toLang);
  const cached = translationCache.get(key);
  if (cached) return cached;

  const langpair = `${MYMEMORY_LANG[fromLang]}|${MYMEMORY_LANG[toLang]}`;
  const params = new URLSearchParams({
    q: chunk,
    langpair,
  });
  if (MYMEMORY_EMAIL) {
    params.set('de', MYMEMORY_EMAIL);
  }
  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translation error ${response.status}`);
  }

  const data = await response.json();
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails ?? 'Translation failed');
  }

  const translated = normalizeText(data.responseData?.translatedText ?? '');
  translationCache.set(key, translated);
  return translated;
}

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
): Promise<string> {
  const clean = normalizeText(text);
  if (!clean) return '';

  const fullKey = buildCacheKey(clean, fromLang, toLang);
  const fullCached = translationCache.get(fullKey);
  if (fullCached) return fullCached;

  const chunks = splitByMaxLength(clean, MAX_CHUNK_LENGTH);
  const translatedChunks = await Promise.all(
    chunks.map((chunk) => translateChunk(chunk, fromLang, toLang)),
  );

  const merged = normalizeText(translatedChunks.join(' '));
  translationCache.set(fullKey, merged);
  return merged;
}
