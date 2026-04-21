import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message, LANGUAGE_LABELS } from '../store/useAppStore';

export default function ChatBubble({ msg }: { msg: Message }) {
  return (
    <View style={styles.container}>
      <View style={styles.original}>
        <Text style={styles.label}>{LANGUAGE_LABELS[msg.fromLang]}</Text>
        <Text style={styles.originalText}>{msg.original}</Text>
      </View>
      <View style={styles.translated}>
        <Text style={styles.label}>{LANGUAGE_LABELS[msg.toLang]}</Text>
        <Text style={styles.translatedText}>{msg.translated}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  original: {
    padding: 12,
    backgroundColor: '#f7f7f7',
  },
  translated: {
    padding: 12,
    backgroundColor: '#eef2ff',
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  originalText: {
    fontSize: 16,
    color: '#333',
  },
  translatedText: {
    fontSize: 16,
    color: '#3366ff',
    fontWeight: '500',
  },
});
