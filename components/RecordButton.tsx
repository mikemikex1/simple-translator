import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface Props {
  recording: boolean;
  transcribing: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

export default function RecordButton({ recording, transcribing, onPressIn, onPressOut }: Props) {
  if (transcribing) {
    return (
      <TouchableOpacity style={[styles.btn, styles.loading]} disabled>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.label}>處理中...</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.btn, recording && styles.active]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{recording ? '🎙️' : '🎤'}</Text>
      <Text style={styles.label}>{recording ? '放開即翻譯' : '按住說話'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3366ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3366ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  active: {
    backgroundColor: '#e53935',
    shadowColor: '#e53935',
  },
  loading: {
    backgroundColor: '#888',
    shadowColor: '#888',
  },
  icon: {
    fontSize: 36,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
});
