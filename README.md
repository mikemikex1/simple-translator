# SimpleTranslator

SimpleTranslator 是一個 React Native（Expo）行動翻譯 App，主打「文字翻譯 + 按住說話即時翻譯」。

## 功能狀態

| 模組 | 狀態 | 說明 |
|---|---|---|
| 文字翻譯 | 已完成 | 輸入文字後即時翻譯，訊息會寫入歷史清單 |
| 語音翻譯 | 已完成 | 按住錄音、放開送出，支援背景佇列翻譯 |
| 語音播放（TTS） | 已完成 | 翻譯完成後自動語音播放 |
| 語言切換 | 已完成 | 來源/目標語言下拉選單 + 一鍵交換 |
| 設定頁 | 已完成 | 顯示服務架構與說明 |
| 相機/相片 OCR | 已移除 | 本版本不保留相機與圖庫翻譯功能 |
| Flutter 程式碼 | 已移除 | 專案僅保留 React Native |

## 技術與服務

- Framework: `React Native 0.81` + `Expo SDK 54`
- Language: `TypeScript`
- State: `Zustand` + `AsyncStorage`
- 語音辨識（STT）: `expo-speech-recognition`（使用裝置可用的 Google Speech 服務）
- 翻譯: `MyMemory API`（免費方案）
- 語音播放（TTS）: `expo-speech`
- UI: `react-native-pager-view` + 自訂元件

## App 大綱（頁面）

1. 文字頁（Text）
- 輸入文字並翻譯
- 顯示翻譯歷史訊息

2. 語音頁（Voice）
- 按住錄音、放開後會多保留 1 秒再停止辨識，降低截斷尾音的機率
- 放開後送入佇列
- 佇列最多並行 2 條翻譯流程
- 顯示每句耗時：`STT / 翻譯 / TTS`
- 提供「停止轉錄」與「清除佇列」

3. 設定頁（Settings）
- 顯示目前服務來源（STT / 翻譯 / TTS）
- 無 API Key 輸入 UI

## 支援語言

- `zh` 中文
- `en` English
- `ja` 日本語
- `vi` Tiếng Việt
- `ko` 한국어
- `pt` Português
- `es` Español
- `ru` Русский
- `nan` 台語
- `fr` Français
- `de` Deutsch

## 專案結構

```text
App.tsx
components/
  LanguageSwitcher.tsx
  RecordButton.tsx
  ChatBubble.tsx
hooks/
  useRecording.ts
  useTranslation.ts
screens/
  TextScreen.tsx
  VoiceScreen.tsx
  SettingsScreen.tsx
services/
  translateService.ts
  speechService.ts
store/
  useAppStore.ts
android/
assets/
```

## 啟動專案（開發）

### 1) 安裝

```bash
npm install
```

### 2) 啟動 Expo（LAN）

```bash
npm run start:clear
```

可用模式：

```bash
npm run start
npm run start:localhost
npm run start:tunnel
```

### 3) 直接跑 Android Native

```bash
npm run android
```

## 測試指令

```bash
npx tsc --noEmit
```

建議手動 Smoke Test：

1. 文字翻譯：輸入一句文字，確認結果與歷史訊息。
2. 語音翻譯：按住說話後放開，確認入佇列與翻譯結果。
3. 連續語音：快速連續錄兩句，確認背景佇列可持續處理。
4. 停止轉錄：錄音中切頁或放開，確認不再持續收音。
5. 清除佇列：翻譯過程中按清除，確認待處理工作被移除。

## MyMemory 免費額度設定（建議）

在 `.env` 設定：

```bash
EXPO_PUBLIC_MYMEMORY_EMAIL=you@example.com
```

系統會自動附加 `de=<email>`，可使用 MyMemory polite pool 額度（以官方規則為準）。

## 打包 Release

### 一鍵修鎖並打包 APK（建議）

```bash
npm run build:release:apk
```

說明：
- 自動修復 `.git` 與 Gradle 常見鎖檔問題
- 預設使用 `%TEMP%\SimpleTranslator\gradle-cache`，並自動 fallback 其他快取路徑
- 自動輸出 release APK
- 已關閉 React Native 新架構，避免 Windows release 時 CMake `.cxx` 被鎖住

### 只修復鎖檔

```bash
npm run fix:locks
```

### 一次性修復 `.git` ACL（需系統管理員）

```bash
npm run fix:git:acl:admin
```

適用情況：
- `fatal: Unable to create .git/index.lock: Permission denied`

### Release APK

```bash
cd android
gradlew.bat assembleRelease
```

輸出檔案：

- `android/app/build/outputs/apk/release/app-release.apk`

### 上架 Google Play（建議 AAB）

```bash
cd android
gradlew.bat bundleRelease
```

輸出檔案：

- `android/app/build/outputs/bundle/release/app-release.aab`

## 注意事項

- `android/gradle.properties` 的 `reactNativeArchitectures=arm64-v8a` 請保留。
- `newArchEnabled` 目前關閉，這版 release 依賴舊架構穩定出包。
- 若手機安裝新 APK 但圖示未更新：先解除安裝舊版，再重裝新版。
- 若要上 Google Play，請改成正式簽章 keystore（目前 release 使用 debug signing）。

## 目前已知議題

- STT 速度與準確度會受手機語音服務與網路品質影響。
