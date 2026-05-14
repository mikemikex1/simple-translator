# SimpleTranslator

SimpleTranslator 是一個 React Native（Expo）行動翻譯 App，主打文字翻譯、按住說話翻譯、語音播放與 Google Mobile Ads 橫幅廣告。

本版本沒有使用 AI / LLM 服務；翻譯來源為 MyMemory API，語音辨識與語音播放使用裝置可用的原生語音服務。

## 版本狀態

- App 版本：`1.0.3`
- Android versionCode：`2`
- 測試狀態：Android 實機 Development Build 已成功測試
- 上架目標：Google Play 封閉測試 AAB

## 目前功能

| 模組 | 狀態 | 說明 |
|---|---|---|
| 文字翻譯 | 已完成 | 輸入文字後呼叫 MyMemory API 翻譯，結果寫入歷史清單 |
| 語音翻譯 | 已完成 | 按住錄音、放開送出，辨識文字後翻譯 |
| 背景佇列 | 已完成 | 語音結果可排入佇列，背景逐筆翻譯與播放 |
| 語音播放（TTS） | 已完成 | 翻譯完成後使用裝置 TTS 自動播放 |
| 語言切換 | 已完成 | 來源/目標語言選單、搜尋、一鍵交換、中英文語言名稱切換 |
| 翻譯歷史 | 已完成 | 文字翻譯結果顯示於訊息列表，可清除 |
| 設定頁 | 已完成 | 顯示 STT / 翻譯 / TTS / Ads 服務來源 |
| Google Mobile Ads | 已完成 | 使用 `react-native-google-mobile-ads` 測試廣告單元 |
| 相機/相簿 OCR | 已移除 | 本版本不保留相機與圖庫翻譯功能 |

## 技術與服務

- Framework: `React Native 0.81` + `Expo SDK 54`
- Language: `TypeScript`
- State: `Zustand` + `AsyncStorage`
- STT: `expo-speech-recognition`
- Translation: `MyMemory API`
- TTS: `expo-speech`
- Ads: `react-native-google-mobile-ads`
- UI: `react-native-pager-view` + 自訂元件

## 重要限制

- Expo Go 不包含 `expo-speech-recognition` 與 `react-native-google-mobile-ads` 原生模組。
- 要測試語音辨識與廣告，必須使用 Development Build、APK 或 AAB 安裝包。
- Google Play 上架需使用正式簽章的 AAB；不要使用 debug signing 作為正式上架包。

## 支援語言

目前支援 48 種語言代碼：

`af`, `ar`, `bg`, `bn`, `ca`, `cs`, `da`, `de`, `el`, `en`, `es`, `et`, `fa`, `fi`, `fil`, `fr`, `he`, `hi`, `hr`, `hu`, `id`, `it`, `ja`, `ko`, `lt`, `lv`, `ms`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `sw`, `ta`, `te`, `th`, `tr`, `uk`, `ur`, `vi`, `zh`, `nan`

`nan` 目前映射為 `zh-TW`，用於台語/台灣語境的近似處理。

## 專案結構

```text
App.tsx
components/
  ChatBubble.tsx
  LanguageSwitcher.tsx
  RecordButton.tsx
hooks/
  useRecording.ts
  useTranslation.ts
screens/
  TextScreen.tsx
  VoiceScreen.tsx
  SettingsScreen.tsx
services/
  translateService.ts
store/
  useAppStore.ts
android/
assets/
```

## 開發指令

```bash
npm install
npm run start:clear
```

Expo Go 只適合測文字翻譯等 JS 功能。原生功能請使用：

```bash
npx expo run:android --device
```

## 測試指令

```bash
npx tsc --noEmit
```

建議手動 Smoke Test：

1. 文字翻譯：輸入一句文字，確認翻譯結果與歷史訊息。
2. 語言切換：切換來源/目標語言，確認翻譯方向正確。
3. 語音翻譯：按住錄音後放開，確認 STT、翻譯、TTS 都完成。
4. 連續語音：連續錄兩句，確認佇列可逐筆處理。
5. 廣告：確認非語音頁底部顯示 Google 測試廣告。

## 環境變數

MyMemory polite pool 可設定：

```bash
EXPO_PUBLIC_MYMEMORY_EMAIL=you@example.com
```

Google Ads 正式廣告單元可設定：

```bash
EXPO_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
```

未設定時會使用 Google 官方測試 Banner ID。

## Android 打包

### Google Play 簽章資訊

Google Play 上傳金鑰由 EAS 託管：

- EAS Configuration: `Build Credentials Qh1YGkHi4p (Default)`
- Keystore Type: `JKS`
- Key Alias: `38509af6c844affb0a7a87cf8f158889`
- SHA1: `3A:E3:86:67:4A:D3:B2:F5:AB:9E:20:33:33:C6:0A:7F:78:84:17:D8`
- SHA256: `5D:87:DA:75:F3:E2:E0:D5:C8:6A:87:51:66:6B:00:D0:CD:8D:60:CC:62:79:65:3F:8B:4F:31:40:FE:42:2E:E6`
- MD5: `01:96:98:CD:28:A7:C8:F9:14:AC:93:AF:E2:DE:CA:47`
- Play Console service account: `play-console-release-bot@simpletranslator-495516.iam.gserviceaccount.com`
- GCP project ID: `simpletranslator-495516`

不要提交 `.jks`、keystore password、key password 或 credentials JSON。請離線備份 EAS 下載的 keystore 與密碼。

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

## 已知議題

- STT 品質與速度依賴手機語音服務、語言包與網路品質。
- MyMemory 免費方案有流量限制，正式產品應評估付費翻譯服務或備援。
- 目前 release signing 需確認使用正式 keystore 後再上傳 Play Console。
