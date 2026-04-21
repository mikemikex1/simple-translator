import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../store/useAppStore';

const KEY_STORE = 'openai_api_key';

export default function SettingsScreen() {
  const { apiKey, setApiKey } = useAppStore();
  const [draft, setDraft] = useState(apiKey);

  useEffect(() => {
    SecureStore.getItemAsync(KEY_STORE).then((val) => {
      if (val) {
        setApiKey(val);
        setDraft(val);
      }
    });
  }, []);

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed.startsWith('sk-')) {
      Alert.alert('格式錯誤', 'OpenAI API Key 應以 sk- 開頭');
      return;
    }
    await SecureStore.setItemAsync(KEY_STORE, trimmed);
    setApiKey(trimmed);
    Alert.alert('已儲存', 'API Key 儲存成功');
  }

  async function clear() {
    await SecureStore.deleteItemAsync(KEY_STORE);
    setApiKey('');
    setDraft('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenAI API Key</Text>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="sk-..."
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>儲存</Text>
      </TouchableOpacity>
      {apiKey ? (
        <TouchableOpacity style={styles.clearBtn} onPress={clear}>
          <Text style={styles.clearBtnText}>清除 Key</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.note}>
        Key 以加密方式儲存於裝置，不會上傳至任何伺服器。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 24, gap: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#333' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#3366ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  clearBtn: { alignItems: 'center', paddingVertical: 8 },
  clearBtnText: { color: '#e53935', fontSize: 14 },
  note: { color: '#aaa', fontSize: 12, lineHeight: 18 },
});
