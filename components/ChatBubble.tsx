import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ToastAndroid, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Message, LANGUAGE_LABELS } from '../store/useAppStore';

async function copyText(text: string) {
  await Clipboard.setStringAsync(text);
  if (Platform.OS === 'android') {
    ToastAndroid.show('已複製', ToastAndroid.SHORT);
  } else {
    Alert.alert('已複製');
  }
}

export default function ChatBubble({ msg }: { msg: Message }) {
  return (
    <View style={styles.container}>
      <View style={styles.original}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>{LANGUAGE_LABELS[msg.fromLang]}</Text>
          <TouchableOpacity onPress={() => copyText(msg.original)} style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>複製</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.originalText}>{msg.original}</Text>
      </View>
      <View style={styles.translated}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>{LANGUAGE_LABELS[msg.toLang]}</Text>
          <TouchableOpacity onPress={() => copyText(msg.translated)} style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>複製</Text>
          </TouchableOpacity>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#999',
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
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(51, 102, 255, 0.1)',
  },
  copyBtnText: {
    fontSize: 11,
    color: '#3366ff',
    fontWeight: '600',
  },
});
