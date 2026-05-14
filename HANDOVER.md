# HANDOVER - SimpleTranslator

更新日期：2026-05-14

## 一、專案定位

SimpleTranslator 是 React Native（Expo）版行動翻譯 App，提供文字翻譯、按住說話翻譯、翻譯後語音播放與 Google Mobile Ads 橫幅廣告。

本版本沒有使用 AI / LLM。翻譯使用 MyMemory API，語音辨識與播放使用裝置原生語音服務。

目前已確認：

- Flutter 程式碼已移除
- 相機/相簿 OCR 功能已移除
- Android 實機 Development Build 已成功測試語音辨識與廣告
- 封閉測試版本：`1.0.3` / Android `versionCode 2`

## 二、目前功能清單

1. 文字翻譯
- 輸入文字後呼叫 MyMemory 翻譯
- 成功後寫入訊息歷史
- 可清除歷史
- 支援來源/目標語言切換

2. 語言切換
- 來源語言與目標語言下拉選單
- 語言搜尋
- 一鍵交換來源/目標語言
- 語言名稱可切換中文/英文顯示

3. 語音翻譯
- 交互方式：按住錄音，放開送出
- 最短錄音保護：少於 3 秒會自動補足時間再停止
- 放開後會額外等待 1 秒再停辨識，減少尾音被截斷
- 錄音停止後才送翻譯，不再持續收音
- 背景佇列：可在翻譯/TTS 處理時繼續錄下一句
- UI 顯示 STT / 翻譯 / TTS 耗時
- 可手動停止轉錄、可清空佇列

4. 語音播放
- 翻譯完成後自動 TTS 播放
- 播放前會先停止上一段語音，避免重疊
- TTS 設有 timeout，避免播放 callback 不回來時卡住流程

5. 廣告
- 使用 `react-native-google-mobile-ads`
- 目前接 Google 官方測試 App ID / Banner ID
- 廣告顯示於非語音頁底部，語音頁避免干擾錄音流程

6. 設定頁
- 顯示 STT / 翻譯 / TTS / Ads 服務來源
- 提醒 Expo Go 不包含語音辨識與廣告原生模組

## 三、技術架構

- React Native 0.81 + Expo SDK 54
- TypeScript
- Zustand + AsyncStorage
- STT：`expo-speech-recognition`
- 翻譯：`MyMemory API`
- TTS：`expo-speech`
- Ads：`react-native-google-mobile-ads`

語音模式資料流程：

1. `useRecording.startListening()` 開始收音
2. 放開按鈕觸發 `stopListening()` 取得文字
3. 文字 enqueue 到 `VoiceScreen` queue
4. queue worker 呼叫 `useTranslation.translateWithMetrics()`
5. 翻譯完成後自 queue 移除
6. 背景執行 TTS 播放並回填 ttsMs

## 四、支援語言

支援語言代碼：

`af`, `ar`, `bg`, `bn`, `ca`, `cs`, `da`, `de`, `el`, `en`, `es`, `et`, `fa`, `fi`, `fil`, `fr`, `he`, `hi`, `hr`, `hu`, `id`, `it`, `ja`, `ko`, `lt`, `lv`, `ms`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `sw`, `ta`, `te`, `th`, `tr`, `uk`, `ur`, `vi`, `zh`, `nan`

`nan` 目前映射為 `zh-TW`。

## 五、關鍵程式檔案

- `App.tsx`：主頁籤容器、SafeArea、底部 Tab、Ads Banner
- `screens/TextScreen.tsx`：文字翻譯 UI
- `screens/VoiceScreen.tsx`：語音錄音、佇列、耗時與結果列表
- `screens/SettingsScreen.tsx`：服務來源與限制說明
- `components/LanguageSwitcher.tsx`：語言選單、搜尋與交換
- `hooks/useRecording.ts`：語音辨識生命週期與事件處理
- `hooks/useTranslation.ts`：翻譯與 TTS 時間統計
- `services/translateService.ts`：MyMemory API 呼叫、切段與快取
- `store/useAppStore.ts`：全域語言與訊息資料

## 六、環境與啟動

安裝：

```bash
npm install
```

Expo LAN：

```bash
npm run start:clear
```

Android 實機 Development Build：

```bash
npx expo run:android --device
```

型別檢查：

```bash
npx tsc --noEmit
```

## 七、封閉測試打包

Google Play 上傳金鑰由 EAS 託管：

- EAS Configuration: `Build Credentials Qh1YGkHi4p (Default)`
- Keystore Type: `JKS`
- Key Alias: `38509af6c844affb0a7a87cf8f158889`
- SHA1: `3A:E3:86:67:4A:D3:B2:F5:AB:9E:20:33:33:C6:0A:7F:78:84:17:D8`
- SHA256: `5D:87:DA:75:F3:E2:E0:D5:C8:6A:87:51:66:6B:00:D0:CD:8D:60:CC:62:79:65:3F:8B:4F:31:40:FE:42:2E:E6`
- MD5: `01:96:98:CD:28:A7:C8:F9:14:AC:93:AF:E2:DE:CA:47`
- Play Console service account: `play-console-release-bot@simpletranslator-495516.iam.gserviceaccount.com`
- GCP project ID: `simpletranslator-495516`

敏感資料不可提交 Git：`.jks`、keystore password、key password、credentials JSON。請將 EAS 下載的 keystore 與密碼做離線備份。

本機 AAB：

```bash
cd android
gradlew.bat bundleRelease
```

輸出：

```text
android/app/build/outputs/bundle/release/app-release.aab
```

EAS Production AAB：

```bash
npm run eas:build:android
```

Submit 到 Google Play internal draft：

```bash
npm run eas:submit:android:closed
```

## 八、部署注意事項

- Expo Go 不可用於測試 `expo-speech-recognition` 與 `react-native-google-mobile-ads`。
- Play Console 封閉測試請上傳 AAB。
- 上傳 Play Console 前需確認 release 使用正式 keystore，不要使用 debug signing。
- 版本已更新為 `1.0.3`，Android `versionCode 2`。

## 九、已知問題與建議

- STT 品質與速度依賴手機語音服務、語言包與網路品質。
- MyMemory 免費方案有流量限制，正式產品應評估備援或付費方案。
- queue 為記憶體型，關閉 App 後未處理佇列不保留。
