import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage } from '../services/ocrService';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { translate, loading: transLoading } = useTranslation();
  const { apiKey } = useAppStore();

  async function pickImage(fromCamera: boolean) {
    setError(null);
    setExtractedText('');
    setTranslatedText('');
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);

    if (!asset.base64) {
      setError('無法取得圖片資料');
      return;
    }

    // Google Vision API key should be stored separately — prompt user if not set
    const googleKey = apiKey; // placeholder: use same key input for now
    if (!googleKey) {
      setError('請先設定 API Key');
      return;
    }

    setOcrLoading(true);
    try {
      const text = await extractTextFromImage(asset.base64, googleKey);
      if (!text) {
        setError('未能辨識文字');
        return;
      }
      setExtractedText(text);
      const translated = await translate(text);
      if (translated) setTranslatedText(translated);
    } catch (e: any) {
      setError(e.message ?? 'OCR 失敗');
    } finally {
      setOcrLoading(false);
    }
  }

  const busy = ocrLoading || transLoading;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btn} onPress={() => pickImage(true)} disabled={busy}>
          <Text style={styles.btnText}>拍照</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => pickImage(false)} disabled={busy}>
          <Text style={styles.btnText}>選圖庫</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}

      {busy && <ActivityIndicator size="large" color="#3366ff" style={{ marginVertical: 20 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {extractedText ? (
        <View style={styles.card}>
          <Text style={styles.label}>辨識文字</Text>
          <Text style={styles.extracted}>{extractedText}</Text>
        </View>
      ) : null}

      {translatedText ? (
        <View style={[styles.card, styles.cardTranslated]}>
          <Text style={styles.label}>翻譯結果</Text>
          <Text style={styles.translated}>{translatedText}</Text>
        </View>
      ) : null}

      {!imageUri && !busy && (
        <Text style={styles.empty}>拍照或選擇圖片以辨識文字</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    backgroundColor: '#3366ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  preview: { width: '100%', height: 220, borderRadius: 10, backgroundColor: '#ddd' },
  error: { color: '#e53935', textAlign: 'center', fontSize: 13 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTranslated: { backgroundColor: '#eef2ff' },
  label: { fontSize: 11, color: '#999' },
  extracted: { fontSize: 15, color: '#333' },
  translated: { fontSize: 17, color: '#3366ff', fontWeight: '600' },
});
