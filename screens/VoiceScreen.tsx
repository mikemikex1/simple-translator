import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import RecordButton from '../components/RecordButton';
import { useRecording } from '../hooks/useRecording';
import { useTranslation } from '../hooks/useTranslation';

interface VoiceResult {
  id: string;
  original: string;
  translated: string;
}

export default function VoiceScreen() {
  const { recording, transcribing, error: recErr, startRecording, stopRecording } = useRecording();
  const { translate, loading, error: transErr } = useTranslation();
  const [results, setResults] = useState<VoiceResult[]>([]);

  async function handlePressOut() {
    const text = await stopRecording();
    if (!text) return;
    const translated = await translate(text);
    if (translated) {
      setResults((prev) => [
        { id: Date.now().toString(), original: text, translated },
        ...prev,
      ]);
    }
  }

  const busy = transcribing || loading;
  const error = recErr || transErr;

  return (
    <View style={styles.container}>
      <View style={styles.btnArea}>
        <RecordButton
          recording={!!recording}
          transcribing={busy}
          onPressIn={startRecording}
          onPressOut={handlePressOut}
        />
        <Text style={styles.hint}>按住錄音，放開自動翻譯</Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
      <ScrollView style={styles.results} contentContainerStyle={styles.resultContent}>
        {results.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.original}>{r.original}</Text>
            <Text style={styles.translated}>{r.translated}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  btnArea: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hint: { color: '#888', fontSize: 13 },
  error: { color: '#e53935', fontSize: 13 },
  results: { flex: 1 },
  resultContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  original: { fontSize: 15, color: '#555' },
  translated: { fontSize: 17, color: '#3366ff', fontWeight: '600' },
});
