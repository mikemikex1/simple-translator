import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ChatBubble from '../components/ChatBubble';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';

export default function TextScreen() {
  const [input, setInput] = useState('');
  const { translate, loading, error } = useTranslation();
  const { messages, clearMessages } = useAppStore();
  const listRef = useRef<FlatList>(null);

  async function handleSubmit() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await translate(text);
    listRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <ChatBubble msg={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>輸入文字並按翻譯</Text>
        }
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="輸入文字..."
          multiline
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.sendText}>{loading ? '...' : '翻譯'}</Text>
        </TouchableOpacity>
      </View>
      {messages.length > 0 && (
        <TouchableOpacity onPress={clearMessages} style={styles.clearBtn}>
          <Text style={styles.clearText}>清除記錄</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { paddingVertical: 12, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },
  error: { color: '#e53935', textAlign: 'center', padding: 8, fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#fafafa',
  },
  sendBtn: {
    backgroundColor: '#3366ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#aaa' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  clearBtn: { alignItems: 'center', paddingVertical: 8, backgroundColor: '#fff' },
  clearText: { color: '#999', fontSize: 12 },
});
