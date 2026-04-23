import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useAppStore, Language, LANGUAGE_LABELS } from '../store/useAppStore';

const LANGUAGES: Language[] = ['zh', 'en', 'ja', 'vi', 'ko', 'pt', 'es', 'ru', 'nan', 'fr', 'de'];

export default function LanguageSwitcher() {
  const { sourceLang, targetLang, setLanguages, swapLanguages } = useAppStore();
  const [pickerMode, setPickerMode] = useState<'source' | 'target' | null>(null);

  const options = useMemo(
    () => LANGUAGES.filter((lang) => (pickerMode === 'source' ? lang !== targetLang : lang !== sourceLang)),
    [pickerMode, sourceLang, targetLang],
  );

  function openSourcePicker() {
    setPickerMode('source');
  }

  function openTargetPicker() {
    setPickerMode('target');
  }

  function selectLanguage(nextLang: Language) {
    if (pickerMode === 'source') {
      setLanguages(nextLang, targetLang);
    } else if (pickerMode === 'target') {
      setLanguages(sourceLang, nextLang);
    }
    setPickerMode(null);
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.langBtn} onPress={openSourcePicker}>
          <Text style={styles.langCaption}>來源</Text>
          <Text style={styles.langText}>{LANGUAGE_LABELS[sourceLang]}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
          <Text style={styles.swapText}>⇄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.langBtn} onPress={openTargetPicker}>
          <Text style={styles.langCaption}>目標</Text>
          <Text style={styles.langText}>{LANGUAGE_LABELS[targetLang]}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={pickerMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerMode(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerMode(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>
              {pickerMode === 'source' ? '選擇來源語言' : '選擇目標語言'}
            </Text>
            <ScrollView style={styles.optionList}>
              {options.map((lang) => (
                <TouchableOpacity key={lang} style={styles.optionRow} onPress={() => selectLanguage(lang)}>
                  <Text style={styles.optionText}>{LANGUAGE_LABELS[lang]}</Text>
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  langCaption: {
    fontSize: 12,
    color: '#6a7aa8',
    marginBottom: 2,
  },
  langText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3366ff',
  },
  swapBtn: {
    padding: 8,
  },
  swapText: {
    fontSize: 20,
    color: '#555',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingTop: 14,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  optionList: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  optionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  optionText: {
    fontSize: 16,
    color: '#0f172a',
  },
});
