import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore, Language, LANGUAGE_LABELS } from '../store/useAppStore';

const LANGUAGES: Language[] = ['zh', 'en', 'ja'];

export default function LanguageSwitcher() {
  const { sourceLang, targetLang, setLanguages, swapLanguages } = useAppStore();

  function cycleSource() {
    const idx = LANGUAGES.indexOf(sourceLang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    if (next !== targetLang) setLanguages(next, targetLang);
    else setLanguages(next, LANGUAGES[(LANGUAGES.indexOf(next) + 1) % LANGUAGES.length]);
  }

  function cycleTarget() {
    const idx = LANGUAGES.indexOf(targetLang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    if (next !== sourceLang) setLanguages(sourceLang, next);
    else setLanguages(sourceLang, LANGUAGES[(LANGUAGES.indexOf(next) + 1) % LANGUAGES.length]);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.langBtn} onPress={cycleSource}>
        <Text style={styles.langText}>{LANGUAGE_LABELS[sourceLang]}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
        <Text style={styles.swapText}>⇄</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.langBtn} onPress={cycleTarget}>
        <Text style={styles.langText}>{LANGUAGE_LABELS[targetLang]}</Text>
      </TouchableOpacity>
    </View>
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
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
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
});
