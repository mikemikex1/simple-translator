import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPPORTED_LANGUAGES = [
  'af', 'ar', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fa', 'fi', 'fil', 'fr',
  'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'ms', 'nl', 'no', 'pl', 'pt', 'ro',
  'ru', 'sk', 'sl', 'sr', 'sv', 'sw', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'vi', 'zh', 'nan',
] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS_ZH: Record<Language, string> = {
  af: '南非語', ar: '阿拉伯語', bg: '保加利亞語', bn: '孟加拉語', ca: '加泰隆尼亞語', cs: '捷克語',
  da: '丹麥語', de: '德語', el: '希臘語', en: '英文', es: '西班牙語', et: '愛沙尼亞語', fa: '波斯語',
  fi: '芬蘭語', fil: '菲律賓語', fr: '法語', he: '希伯來語', hi: '印地語', hr: '克羅埃西亞語',
  hu: '匈牙利語', id: '印尼語', it: '義大利語', ja: '日語', ko: '韓語', lt: '立陶宛語',
  lv: '拉脫維亞語', ms: '馬來語', nl: '荷蘭語', no: '挪威語', pl: '波蘭語', pt: '葡萄牙語',
  ro: '羅馬尼亞語', ru: '俄語', sk: '斯洛伐克語', sl: '斯洛維尼亞語', sr: '塞爾維亞語',
  sv: '瑞典語', sw: '史瓦希里語', ta: '泰米爾語', te: '泰盧固語', th: '泰語', tr: '土耳其語',
  uk: '烏克蘭語', ur: '烏爾都語', vi: '越南語', zh: '中文', nan: '台語',
};

export const LANGUAGE_LABELS_EN: Record<Language, string> = {
  af: 'Afrikaans', ar: 'Arabic', bg: 'Bulgarian', bn: 'Bengali', ca: 'Catalan', cs: 'Czech',
  da: 'Danish', de: 'German', el: 'Greek', en: 'English', es: 'Spanish', et: 'Estonian', fa: 'Persian',
  fi: 'Finnish', fil: 'Filipino', fr: 'French', he: 'Hebrew', hi: 'Hindi', hr: 'Croatian',
  hu: 'Hungarian', id: 'Indonesian', it: 'Italian', ja: 'Japanese', ko: 'Korean', lt: 'Lithuanian',
  lv: 'Latvian', ms: 'Malay', nl: 'Dutch', no: 'Norwegian', pl: 'Polish', pt: 'Portuguese',
  ro: 'Romanian', ru: 'Russian', sk: 'Slovak', sl: 'Slovenian', sr: 'Serbian', sv: 'Swedish',
  sw: 'Swahili', ta: 'Tamil', te: 'Telugu', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian',
  ur: 'Urdu', vi: 'Vietnamese', zh: 'Chinese', nan: 'Taiwanese Hokkien',
};

export const LANGUAGE_LABELS = LANGUAGE_LABELS_ZH;

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
  messages: Message[];
  useCloudSTT: boolean;
  setLanguages: (source: Language, target: Language) => void;
  swapLanguages: () => void;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setUseCloudSTT: (value: boolean) => void;
  loadSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  sourceLang: 'zh',
  targetLang: 'en',
  messages: [],
  useCloudSTT: true,

  setLanguages: (source, target) => {
    set({ sourceLang: source, targetLang: target });
    AsyncStorage.setItem('sourceLang', source);
    AsyncStorage.setItem('targetLang', target);
  },

  swapLanguages: () => {
    const { sourceLang, targetLang } = get();
    get().setLanguages(targetLang, sourceLang);
  },

  addMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  clearMessages: () => set({ messages: [] }),

  setUseCloudSTT: (value) => {
    set({ useCloudSTT: value });
    AsyncStorage.setItem('useCloudSTT', value ? '1' : '0');
  },

  loadSettings: async () => {
    const [source, target, cloudStt] = await Promise.all([
      AsyncStorage.getItem('sourceLang'),
      AsyncStorage.getItem('targetLang'),
      AsyncStorage.getItem('useCloudSTT'),
    ]);

    if (source && SUPPORTED_LANGUAGES.includes(source as Language)) {
      set({ sourceLang: source as Language });
    }
    if (target && SUPPORTED_LANGUAGES.includes(target as Language)) {
      set({ targetLang: target as Language });
    }
    if (cloudStt !== null) {
      set({ useCloudSTT: cloudStt === '1' });
    }
  },
}));
