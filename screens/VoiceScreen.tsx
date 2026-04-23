import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import RecordButton from '../components/RecordButton';
import { useRecording } from '../hooks/useRecording';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import type { Language } from '../store/useAppStore';

interface VoiceResult {
  id: string;
  original: string;
  translated: string;
  fromLang: Language;
  toLang: Language;
  sttMs: number;
  translationMs: number;
  ttsMs: number;
}

interface QueuedVoiceItem {
  id: string;
  text: string;
  fromLang: Language;
  toLang: Language;
  sttMs: number;
  status: 'queued' | 'processing';
}

interface VoiceScreenProps {
  isActive: boolean;
}

const MIN_RECORD_MS = 3000;

export default function VoiceScreen({ isActive }: VoiceScreenProps) {
  const { sourceLang, targetLang } = useAppStore();
  const {
    listening,
    transcribing,
    error: recErr,
    startListening,
    stopListening,
    cancelTranscribing,
  } = useRecording();
  const { translateWithMetrics, speakTextWithTiming, error: transErr } = useTranslation();

  const [results, setResults] = useState<VoiceResult[]>([]);
  const [queue, setQueue] = useState<QueuedVoiceItem[]>([]);
  const [recordingNotice, setRecordingNotice] = useState<string | null>(null);

  const sessionLangRef = useRef<{ fromLang: Language; toLang: Language }>({
    fromLang: sourceLang,
    toLang: targetLang,
  });
  const pressInAtRef = useRef<number | null>(null);
  const finalizingRef = useRef(false);
  const pressedRef = useRef(false);
  const releaseRequestedRef = useRef(false);
  const processingIdRef = useRef<string | null>(null);
  const ttsChainRef = useRef<Promise<void>>(Promise.resolve());

  const queuedCount = useMemo(() => queue.filter((x) => x.status === 'queued').length, [queue]);
  const processingCount = useMemo(
    () => queue.filter((x) => x.status === 'processing').length,
    [queue],
  );
  const pendingCount = queue.length;

  function resetPressState() {
    pressedRef.current = false;
    releaseRequestedRef.current = false;
    pressInAtRef.current = null;
    finalizingRef.current = false;
  }

  function enqueueText(text: string | null, sttMs: number) {
    const cleaned = text?.trim();
    if (!cleaned) return;

    setQueue((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: cleaned,
        fromLang: sessionLangRef.current.fromLang,
        toLang: sessionLangRef.current.toLang,
        sttMs,
        status: 'queued',
      },
    ]);
  }

  function beginRecordSession() {
    if (finalizingRef.current) return;

    setRecordingNotice(null);
    sessionLangRef.current = { fromLang: sourceLang, toLang: targetLang };
    pressInAtRef.current = Date.now();
    pressedRef.current = true;
    releaseRequestedRef.current = false;

    startListening().then((started) => {
      if (!started) {
        resetPressState();
      }
    });
  }

  async function finalizeCurrentRecording() {
    if (finalizingRef.current) return;
    if (!pressedRef.current) return;

    if (!listening) {
      releaseRequestedRef.current = true;
      return;
    }

    finalizingRef.current = true;
    releaseRequestedRef.current = false;

    try {
      const startedAt = pressInAtRef.current ?? Date.now();
      const elapsed = Date.now() - startedAt;

      if (elapsed < MIN_RECORD_MS) {
        setRecordingNotice(`錄音太短，已自動補足 ${MIN_RECORD_MS / 1000} 秒`);
        await new Promise((resolve) => setTimeout(resolve, MIN_RECORD_MS - elapsed));
      } else {
        setRecordingNotice(null);
      }

      const sttMs = Date.now() - startedAt;
      const text = await stopListening();
      enqueueText(text, sttMs);
    } finally {
      resetPressState();
    }
  }

  useEffect(() => {
    if (listening && pressedRef.current && releaseRequestedRef.current && !finalizingRef.current) {
      void finalizeCurrentRecording();
    }
  }, [listening]);

  useEffect(() => {
    if (!isActive && pressedRef.current) {
      void finalizeCurrentRecording();
    }
  }, [isActive, listening]);

  useEffect(() => {
    if (processingIdRef.current) return;

    const next = queue.find((item) => item.status === 'queued');
    if (!next) return;

    processingIdRef.current = next.id;
    setQueue((prev) =>
      prev.map((item) => (item.id === next.id ? { ...item, status: 'processing' } : item)),
    );

    let active = true;
    (async () => {
      const { translated, translationMs } = await translateWithMetrics(next.text, {
        fromLang: next.fromLang,
        toLang: next.toLang,
        speak: false,
      });
      if (!active) return;

      // 每完成一筆翻譯就立刻從佇列移除（佇列 -1）
      setQueue((prev) => prev.filter((item) => item.id !== next.id));

      if (translated) {
        setResults((prev) => [
          {
            id: next.id,
            original: next.text,
            translated,
            fromLang: next.fromLang,
            toLang: next.toLang,
            sttMs: next.sttMs,
            translationMs,
            ttsMs: 0,
          },
          ...prev,
        ]);

        // TTS 串行，避免後一句直接中斷前一句
        ttsChainRef.current = ttsChainRef.current.then(async () => {
          const ttsMs = await speakTextWithTiming(translated, next.toLang);
          if (!active) return;
          setResults((prev) => prev.map((r) => (r.id === next.id ? { ...r, ttsMs } : r)));
        });
      }
    })().finally(() => {
      if (processingIdRef.current === next.id) {
        processingIdRef.current = null;
      }
    });

    return () => {
      active = false;
    };
  }, [queue, translateWithMetrics, speakTextWithTiming]);

  function clearQueue() {
    setQueue([]);
  }

  const busy = transcribing || pendingCount > 0;
  const error = recErr || transErr;

  return (
    <View style={styles.container}>
      <View style={styles.btnArea}>
        <RecordButton
          recording={listening}
          transcribing={transcribing}
          onPressIn={beginRecordSession}
          onPressOut={finalizeCurrentRecording}
        />

        <Text style={styles.hint}>
          {listening
            ? '錄音中，放開即可送出翻譯'
            : busy
              ? `處理中：執行 ${processingCount} / 等待 ${queuedCount} / 總佇列 ${pendingCount}`
              : '按住錄音，放開後會自動翻譯並語音回覆'}
        </Text>

        {(listening || transcribing) && (
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={() => {
              cancelTranscribing();
              resetPressState();
            }}
          >
            <Text style={styles.stopBtnText}>停止轉錄</Text>
          </TouchableOpacity>
        )}

        {pendingCount > 0 && (
          <TouchableOpacity style={styles.clearQueueBtn} onPress={clearQueue}>
            <Text style={styles.clearQueueBtnText}>清除佇列（{pendingCount}）</Text>
          </TouchableOpacity>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {recordingNotice && <Text style={styles.notice}>{recordingNotice}</Text>}
      </View>

      <ScrollView style={styles.results} contentContainerStyle={styles.resultContent}>
        {results.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.langTag}>
              {r.fromLang} {'->'} {r.toLang}
            </Text>
            <Text style={styles.original}>{r.original}</Text>
            <Text style={styles.translated}>{r.translated}</Text>
            <Text style={styles.timing}>
              STT {r.sttMs}ms | 翻譯 {r.translationMs}ms | TTS {r.ttsMs}ms
            </Text>
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
    paddingVertical: 24,
    backgroundColor: '#fff',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hint: { color: '#666', fontSize: 13 },
  stopBtn: {
    backgroundColor: '#e53935',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stopBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  clearQueueBtn: {
    backgroundColor: '#666',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearQueueBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  error: { color: '#e53935', fontSize: 13 },
  notice: { color: '#8a6a00', fontSize: 12 },
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
  langTag: { fontSize: 12, color: '#7b8594' },
  original: { fontSize: 15, color: '#555' },
  translated: { fontSize: 17, color: '#3366ff', fontWeight: '600' },
  timing: { fontSize: 12, color: '#8a8a8a' },
});
