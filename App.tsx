import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { StatusBar } from 'expo-status-bar';
import LanguageSwitcher from './components/LanguageSwitcher';
import TextScreen from './screens/TextScreen';
import VoiceScreen from './screens/VoiceScreen';
import CameraScreen from './screens/CameraScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useAppStore } from './store/useAppStore';

const TABS = [
  { key: 'text', label: '文字' },
  { key: 'voice', label: '語音' },
  { key: 'camera', label: '相機' },
  { key: 'settings', label: '設定' },
];

const HIDE_LANG_SWITCHER = ['settings'];

export default function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const pagerRef = useRef<PagerView>(null);
  const { loadSettings } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  function goTo(index: number) {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
  }

  const currentKey = TABS[currentPage].key;
  const showLang = !HIDE_LANG_SWITCHER.includes(currentKey);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {showLang && <LanguageSwitcher />}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={1}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        <View key="text"><TextScreen /></View>
        <View key="voice"><VoiceScreen /></View>
        <View key="camera"><CameraScreen /></View>
        <View key="settings"><SettingsScreen /></View>
      </PagerView>
      <View style={styles.tabBar}>
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
