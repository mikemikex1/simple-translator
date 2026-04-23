import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>關於 SimpleTranslator</Text>

      <View style={styles.card}>
        <Text style={styles.label}>語音辨識（STT）</Text>
        <Text style={styles.value}>Google 語音辨識（免費）</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>翻譯服務</Text>
        <Text style={styles.value}>MyMemory（免費，每日 1000 詞）</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>語音播放（TTS）</Text>
        <Text style={styles.value}>裝置內建語音引擎（免費）</Text>
      </View>

      <Text style={styles.note}>
        本應用程式所有功能完全免費，無需 API Key。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 24, gap: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 12, color: '#888' },
  value: { fontSize: 14, fontWeight: '600', color: '#333' },
  note: { color: '#777', fontSize: 12, lineHeight: 18, marginTop: 8 },
});
