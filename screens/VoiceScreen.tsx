import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
const RELEASE_CAPTURE_PADDING_MS = 1000;

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const sessionLangRef = useRef<{ fromLang: Language; toLang: Language }>({
    fromLang: sourceLang,
    toLang: targetLang,
  });
  const startedAtRef = useRef<number | null>(null);
  const finalizingRef = useRef(false);
  const activeRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const processingIdRef = useRef<string | null>(null);
  const ttsChainRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const queuedCount = useMemo(() => queue.filter((x) => x.status === 'queued').length, [queue]);
  const processingCount = useMemo(
    () => queue.filter((x) => x.status === 'processing').length,
    [queue],
  );
  const pendingCount = queue.length;

  function resetSessionState() {
    activeRef.current = false;
    stopRequestedRef.current = false;
    startedAtRef.current = null;
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
    startedAtRef.current = Date.now();
    activeRef.current = true;
    stopRequestedRef.current = false;

    startListening().then((started) => {
      if (!started) {
        resetSessionState();
      }
    });
  }

  async function finalizeCurrentRecording() {
    if (finalizingRef.current) return;
    if (!activeRef.current) return;

    if (!listening) {
      stopRequestedRef.current = true;
      return;
    }

    finalizingRef.current = true;
    stopRequestedRef.current = false;

    try {
      const startedAt = startedAtRef.current ?? Date.now();
      const elapsed = Date.now() - startedAt;

      if (elapsed < MIN_RECORD_MS) {
        setRecordingNotice(`錄音太短，已自動補足 ${MIN_RECORD_MS / 1000} 秒`);
        await new Promise((resolve) => setTimeout(resolve, MIN_RECORD_MS - elapsed));
      } else {
        setRecordingNotice(null);
      }

      await new Promise((resolve) => setTimeout(resolve, RELEASE_CAPTURE_PADDING_MS));

      const sttMs = Date.now() - startedAt;
      const text = await stopListening();
      enqueueText(text, sttMs);
    } finally {
      resetSessionState();
    }
  }

  function toggleRecording() {
    if (transcribing || finalizingRef.current) return;
    if (activeRef.current) {
      void finalizeCurrentRecording();
    } else {
      beginRecordSession();
    }
  }

  useEffect(() => {
    if (listening && activeRef.current && stopRequestedRef.current && !finalizingRef.current) {
      void finalizeCurrentRecording();
    }
  }, [listening]);

  useEffect(() => {
    if (!isActive && activeRef.current) {
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

    (async () => {
      const { translated, translationMs } = await translateWithMetrics(next.text, {
        fromLang: next.fromLang,
        toLang: next.toLang,
        speak: false,
      });
      if (!mountedRef.current) return;

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
          if (!mountedRef.current) return;
          setResults((prev) => prev.map((r) => (r.id === next.id ? { ...r, ttsMs } : r)));
        });
      }
    })().finally(() => {
      if (processingIdRef.current === next.id) {
        processingIdRef.current = null;
      }
    });
  }, [queue, translateWithMetrics, speakTextWithTiming]);

  function clearQueue() {
    setQueue([]);
  }

  async function copyText(text: string) {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('已複製', ToastAndroid.SHORT);
    } else {
      Alert.alert('已複製');
    }
  }

  function beginEdit(item: VoiceResult) {
    setEditingId(item.id);
    setEditingText(item.original);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText('');
  }

  async function confirmEdit(item: VoiceResult) {
    const newText = editingText.trim();
    setEditingId(null);
    setEditingText('');
    if (!newText || newText === item.original) return;

    const { translated, translationMs } = await translateWithMetrics(newText, {
      fromLang: item.fromLang,
      toLang: item.toLang,
      speak: false,
    });
    if (!mountedRef.current || !translated) return;

    setResults((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? { ...r, original: newText, translated, translationMs, ttsMs: 0 }
          : r,
      ),
    );

    ttsChainRef.current = ttsChainRef.current.then(async () => {
      const ttsMs = await speakTextWithTiming(translated, item.toLang);
      if (!mountedRef.current) return;
      setResults((prev) => prev.map((r) => (r.id === item.id ? { ...r, ttsMs } : r)));
    });
  }

  const busy = transcribing || pendingCount > 0;
  const error = recErr || transErr;

  return (
    <View style={styles.container}>
      <View style={styles.btnArea}>
        <RecordButton
          recording={listening}
          transcribing={transcribing}
          onToggle={toggleRecording}
        />

        <Text style={styles.hint}>
          {listening
            ? '錄音中，點擊按鈕送出翻譯'
            : busy
              ? `處理中：執行 ${processingCount} / 等待 ${queuedCount} / 總佇列 ${pendingCount}`
              : '點擊開始錄音，再點一次送出翻譯'}
        </Text>

        {(listening || transcribing) && (
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={() => {
              cancelTranscribing();
              resetSessionState();
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
            {editingId === r.id ? (
              <>
                <TextInput
                  style={styles.editInput}
                  value={editingText}
                  onChangeText={setEditingText}
                  multiline
                  autoFocus
                  placeholder="修正辨識結果後重新翻譯"
                />
                <View style={styles.editBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                    <Text style={styles.cancelBtnText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmEdit(r)}>
                    <Text style={styles.confirmBtnText}>重新翻譯</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.originalRow}>
                  <Text style={[styles.original, { flex: 1 }]}>{r.original}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => copyText(r.original)}>
                    <Text style={styles.copyBtnText}>複製</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editBtn} onPress={() => beginEdit(r)}>
                    <Text style={styles.editBtnText}>編輯</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.originalRow}>
                  <Text style={[styles.translated, { flex: 1 }]}>{r.translated}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => copyText(r.translated)}
                  >
                    <Text style={styles.copyBtnText}>複製</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  originalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  original: { fontSize: 15, color: '#555' },
  translated: { fontSize: 17, color: '#3366ff', fontWeight: '600' },
  timing: { fontSize: 12, color: '#8a8a8a' },
  editBtn: {
    backgroundColor: '#eef1f6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editBtnText: { fontSize: 12, color: '#3366ff', fontWeight: '600' },
  copyBtn: {
    backgroundColor: 'rgba(51, 102, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  copyBtnText: { fontSize: 12, color: '#3366ff', fontWeight: '600' },
  editInput: {
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccd',
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  cancelBtnText: { fontSize: 13, color: '#555' },
  confirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3366ff',
  },
  confirmBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
});
