import React, { useEffect, useState } from 'react';
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

const OPENAI_KEY_STORE = 'openai_api_key';

export default function SettingsScreen() {
  const { apiKey, setApiKey } = useAppStore();
  const [openAiDraft, setOpenAiDraft] = useState(apiKey);

  useEffect(() => {
    SecureStore.getItemAsync(OPENAI_KEY_STORE).then((openAiKey) => {
      if (openAiKey) {
        setApiKey(openAiKey);
        setOpenAiDraft(openAiKey);
      }
    });
  }, [setApiKey]);

  async function save() {
    const openAi = openAiDraft.trim();

    if (!openAi.startsWith('sk-')) {
      Alert.alert('Invalid OpenAI Key', 'OpenAI API Key should start with sk-.');
      return;
    }

    await SecureStore.setItemAsync(OPENAI_KEY_STORE, openAi);
    setApiKey(openAi);
    Alert.alert('Saved', 'OpenAI API key has been saved.');
  }

  async function clear() {
    await SecureStore.deleteItemAsync(OPENAI_KEY_STORE);
    setApiKey('');
    setOpenAiDraft('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenAI API Key</Text>
      <TextInput
        style={styles.input}
        value={openAiDraft}
        onChangeText={setOpenAiDraft}
        placeholder="sk-..."
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>Save Key</Text>
      </TouchableOpacity>

      {apiKey ? (
        <TouchableOpacity style={styles.clearBtn} onPress={clear}>
          <Text style={styles.clearBtnText}>Clear Key</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.note}>
        OpenAI key is used for translation and speech features.
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
  note: { color: '#777', fontSize: 12, lineHeight: 18 },
});
