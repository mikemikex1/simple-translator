import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText } from '../services/ocrService';
import { useTranslation } from '../hooks/useTranslation';

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const { translate, loading: translating } = useTranslation();

  async function pickImage(fromCamera: boolean) {
    const { granted } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!granted) {
      Alert.alert('需要權限', fromCamera ? '請允許相機存取' : '請允許相簿存取');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setOcrText(null);
    setTranslatedText(null);

    setOcrLoading(true);
    try {
      const text = await recognizeText(uri);
      if (!text) {
        Alert.alert('未偵測到文字', '請選擇含有清晰文字的圖片');
        setOcrLoading(false);
        return;
      }
      setOcrText(text);
      const translated = await translate(text);
      setTranslatedText(translated);
    } catch (e: any) {
      Alert.alert('錯誤', e.message ?? 'OCR 失敗');
    } finally {
      setOcrLoading(false);
    }
  }

  const busy = ocrLoading || translating;

  return (
    <View style={styles.container}>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={() => pickImage(true)}
          disabled={busy}
        >
          <Text style={styles.btnText}>📷 拍照</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={() => pickImage(false)}
          disabled={busy}
        >
          <Text style={styles.btnText}>🖼️ 相簿</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        )}

        {busy && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#3366ff" />
            <Text style={styles.loadingText}>
              {ocrLoading ? '辨識文字中...' : '翻譯中...'}
            </Text>
          </View>
        )}

        {ocrText && !busy && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>原文</Text>
            <Text style={styles.cardText}>{ocrText}</Text>
          </View>
        )}

        {translatedText && !busy && (
          <View style={[styles.card, styles.cardBlue]}>
            <Text style={styles.cardLabel}>譯文</Text>
            <Text style={styles.cardText}>{translatedText}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  btn: {
    flex: 1,
    backgroundColor: '#3366ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#aaa' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: { color: '#555', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    gap: 4,
    elevation: 2,
  },
  cardBlue: { backgroundColor: '#eef2ff' },
  cardLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  cardText: { fontSize: 14, color: '#333', lineHeight: 20 },
});
