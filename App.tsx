import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LanguageSwitcher from './components/LanguageSwitcher';
import TextScreen from './screens/TextScreen';
import VoiceScreen from './screens/VoiceScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useAppStore } from './store/useAppStore';

const TABS = [
  { key: 'text', label: '文字' },
  { key: 'voice', label: '語音' },
  { key: 'settings', label: '設定' },
] as const;

const HIDE_LANG_SWITCHER = ['settings'];

function AppContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const pagerRef = useRef<PagerView>(null);
  const { loadSettings } = useAppStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function goTo(index: number) {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
  }

  const currentKey = TABS[currentPage].key;
  const showLang = !HIDE_LANG_SWITCHER.includes(currentKey);

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <StatusBar style="dark" />
      {showLang && <LanguageSwitcher />}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={1}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        <View key="text"><TextScreen /></View>
        <View key="voice"><VoiceScreen isActive={currentKey === 'voice'} /></View>
        <View key="settings"><SettingsScreen /></View>
      </PagerView>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => goTo(i)}
          >
            <Text style={[styles.tabText, currentPage === i && styles.tabActive]}>
              {tab.label}
            </Text>
            {currentPage === i && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  pager: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  tabActive: { color: '#3366ff', fontWeight: '700' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    backgroundColor: '#3366ff',
    borderRadius: 2,
  },
});
