import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'zh' | 'en' | 'ja' | 'vi' | 'ko' | 'pt' | 'es' | 'ru' | 'nan' | 'fr' | 'de';

export const LANGUAGE_LABELS: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  vi: 'Tiếng Việt',
  ko: '한국어',
  pt: 'Português',
  es: 'Español',
  ru: 'Русский',
  nan: '台語',
  fr: 'Français',
  de: 'Deutsch',
};

export interface Message {
  id: string;
  original: string;
  translated: string;
  fromLang: Language;
  toLang: Language;
  timestamp: number;
}

interface AppState {
  sourceLang: Language;
  targetLang: Language;
  apiKey: string;
  messages: Message[];
  setLanguages: (source: Language, target: Language) => void;
  swapLanguages: () => void;
  setApiKey: (key: string) => void;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  loadSettings: () => Promise<void>;
}

const SUPPORTED_LANGUAGES: Language[] = [
  'zh',
  'en',
  'ja',
  'vi',
  'ko',
  'pt',
  'es',
  'ru',
  'nan',
  'fr',
  'de',
];

export const useAppStore = create<AppState>((set, get) => ({
  sourceLang: 'zh',
  targetLang: 'en',
  apiKey: '',
  messages: [],

  setLanguages: (source, target) => {
    set({ sourceLang: source, targetLang: target });
    AsyncStorage.setItem('sourceLang', source);
    AsyncStorage.setItem('targetLang', target);
  },

  swapLanguages: () => {
    const { sourceLang, targetLang } = get();
    get().setLanguages(targetLang, sourceLang);
  },

  setApiKey: (key) => {
    set({ apiKey: key });
  },

  addMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  clearMessages: () => set({ messages: [] }),

  loadSettings: async () => {
    const [source, target] = await Promise.all([
      AsyncStorage.getItem('sourceLang'),
      AsyncStorage.getItem('targetLang'),
    ]);

    if (source && SUPPORTED_LANGUAGES.includes(source as Language)) {
      set({ sourceLang: source as Language });
    }
    if (target && SUPPORTED_LANGUAGES.includes(target as Language)) {
      set({ targetLang: target as Language });
    }
  },
}));
