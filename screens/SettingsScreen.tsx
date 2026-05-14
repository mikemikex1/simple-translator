import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export default function SettingsScreen() {
  const { useCloudSTT, setUseCloudSTT } = useAppStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>關於 SimpleTranslator</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>使用雲端語音辨識</Text>
            <Text style={styles.hint}>
              開啟可降低中文同音字辨識錯誤（如「是→4」「南→男」），需網路連線
            </Text>
          </View>
          <Switch value={useCloudSTT} onValueChange={setUseCloudSTT} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>語音辨識（STT）</Text>
        <Text style={styles.value}>裝置語音服務 / expo-speech-recognition</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>翻譯服務</Text>
        <Text style={styles.value}>MyMemory API（非 AI 翻譯模型）</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>語音播放（TTS）</Text>
        <Text style={styles.value}>裝置語音播放 / expo-speech</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>廣告</Text>
        <Text style={styles.value}>Google Mobile Ads 測試廣告單元</Text>
      </View>

      <Text style={styles.note}>
        本版本不需要使用者輸入 API Key。語音辨識與廣告需使用 Development Build 或正式安裝包測試，Expo Go 不包含這些原生模組。
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 12, color: '#888' },
  value: { fontSize: 14, fontWeight: '600', color: '#333' },
  hint: { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 16 },
  note: { color: '#777', fontSize: 12, lineHeight: 18, marginTop: 8 },
});
