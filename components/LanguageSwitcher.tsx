import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  useAppStore,
  Language,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS_ZH,
  LANGUAGE_LABELS_EN,
} from '../store/useAppStore';

type UiLang = 'zh' | 'en';

export default function LanguageSwitcher() {
  const { sourceLang, targetLang, setLanguages, swapLanguages } = useAppStore();
  const [pickerMode, setPickerMode] = useState<'source' | 'target' | null>(null);
  const [uiLang, setUiLang] = useState<UiLang>('zh');
  const [query, setQuery] = useState('');

  const labels = uiLang === 'zh' ? LANGUAGE_LABELS_ZH : LANGUAGE_LABELS_EN;
  const normalizedQuery = query.trim().toLowerCase();

  const options = useMemo(() => {
    return SUPPORTED_LANGUAGES
      .filter((lang) => (pickerMode === 'source' ? lang !== targetLang : lang !== sourceLang))
      .filter((lang) => {
        if (!normalizedQuery) return true;
        const zh = LANGUAGE_LABELS_ZH[lang].toLowerCase();
        const en = LANGUAGE_LABELS_EN[lang].toLowerCase();
        const code = lang.toLowerCase();
        return zh.includes(normalizedQuery) || en.includes(normalizedQuery) || code.includes(normalizedQuery);
      });
  }, [pickerMode, sourceLang, targetLang, normalizedQuery]);

  function selectLanguage(nextLang: Language) {
    if (pickerMode === 'source') setLanguages(nextLang, targetLang);
    if (pickerMode === 'target') setLanguages(sourceLang, nextLang);
    setPickerMode(null);
    setQuery('');
  }

  function closePicker() {
    setPickerMode(null);
    setQuery('');
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setPickerMode('source')}>
          <Text style={styles.langCaption}>{uiLang === 'zh' ? '來源語言' : 'Source'}</Text>
          <Text style={styles.langText}>{labels[sourceLang]}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
          <Text style={styles.swapText}>⇄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.langBtn} onPress={() => setPickerMode('target')}>
          <Text style={styles.langCaption}>{uiLang === 'zh' ? '目標語言' : 'Target'}</Text>
          <Text style={styles.langText}>{labels[targetLang]}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uiLangBtn} onPress={() => setUiLang((v) => (v === 'zh' ? 'en' : 'zh'))}>
          <Text style={styles.uiLangBtnText}>{uiLang === 'zh' ? '中/EN' : 'EN/中'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={pickerMode !== null} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable style={styles.backdrop} onPress={closePicker}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>
              {pickerMode === 'source'
                ? (uiLang === 'zh' ? '選擇來源語言' : 'Choose source language')
                : (uiLang === 'zh' ? '選擇目標語言' : 'Choose target language')}
            </Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={uiLang === 'zh' ? '搜尋語言（名稱或代碼）' : 'Search language (name or code)'}
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
            <ScrollView style={styles.optionList}>
              {options.map((lang) => (
                <TouchableOpacity key={lang} style={styles.optionRow} onPress={() => selectLanguage(lang)}>
                  <Text style={styles.optionText}>{labels[lang]}</Text>
                  <Text style={styles.optionCode}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', gap: 8 },
  langBtn: { flex: 1, alignItems: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f0f4ff', borderRadius: 8 },
  langCaption: { fontSize: 12, color: '#6a7aa8', marginBottom: 2 },
  langText: { fontSize: 15, fontWeight: '600', color: '#3366ff' },
  swapBtn: { padding: 8 },
  swapText: { fontSize: 20, color: '#555' },
  uiLangBtn: { backgroundColor: '#eef2ff', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  uiLangBtnText: { color: '#3730a3', fontSize: 12, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  sheet: { width: '100%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, paddingTop: 14, paddingBottom: 8, overflow: 'hidden' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', paddingHorizontal: 16, paddingBottom: 10 },
  searchInput: { marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  optionList: { borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  optionRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eef2f7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 16, color: '#0f172a' },
  optionCode: { fontSize: 12, color: '#64748b' },
});
