# HANDOVER - SimpleTranslator

更新日期：2026-04-25

## 一、專案定位

本專案為 React Native（Expo）版多語翻譯 App，包含文字翻譯與語音翻譯。

目前已確認：
- Flutter 程式碼已移除
- 相機/相簿 OCR 功能已移除
- Android 可產出 release APK

## 二、目前功能清單

1. 文字翻譯
- 輸入文字後呼叫 MyMemory 翻譯
- 成功後寫入訊息歷史
- 支援來源/目標語言切換

2. 語音翻譯
- 交互方式：按住錄音，放開送出
- 最短錄音保護：少於 2 秒會自動補足時間再停止
- 放開後會額外等待 1 秒再停辨識，減少尾音被截斷
- 錄音停止後才送翻譯，不再持續收音
- 佇列機制：可在背景翻譯時繼續錄下一句
- 併發上限：2 條翻譯流程並行
- UI 顯示 STT / 翻譯 / TTS 耗時
- 可手動停止轉錄、可清空佇列

3. 設定頁
- 服務架構資訊頁（非 API Key 設定頁）

## 三、技術架構

- 前端框架：React Native 0.81 + Expo 54
- 語言：TypeScript
- 狀態管理：Zustand + AsyncStorage
- STT：expo-speech-recognition
- 翻譯：MyMemory API
- TTS：expo-speech

資料流程（語音模式）：
1. `useRecording.startListening()` 開始收音
2. 放開按鈕觸發 `stopListening()` 取得文字
3. 文字 enqueue 到 `VoiceScreen` queue
4. queue worker 呼叫 `useTranslation.translateWithMetrics()`
5. 翻譯完成後即時自 queue 減 1
6. 背景執行 TTS 播放並回填 ttsMs

重要修正：
- `VoiceScreen` 的 queue worker 不能在 effect cleanup 裡用區域 `active` flag 擋住整個流程，否則會讓 `setQueue` 後的重 render 中斷翻譯、TTS 與 queue 更新
- `useTranslation.speakWithTiming()` 會先 `Speech.stop()` 再播，避免殘留播放狀態影響下一句

## 四、支援語言

- `zh` 中文
- `en` 英文
- `ja` 日文
- `vi` 越文
- `ko` 韓文
- `pt` 葡文
- `es` 西文
- `ru` 俄文
- `nan` 台語
- `fr` 法文
- `de` 德文

## 五、關鍵程式檔案

- `App.tsx`：主頁籤容器、SafeArea 與底部 Tab
- `screens/TextScreen.tsx`：文字翻譯 UI
- `screens/VoiceScreen.tsx`：語音錄音、佇列、耗時與結果列表
- `components/LanguageSwitcher.tsx`：語言選單切換
- `hooks/useRecording.ts`：錄音生命週期與轉錄事件處理
- `hooks/useTranslation.ts`：翻譯與 TTS 時間統計
- `services/translateService.ts`：MyMemory API 呼叫與切段翻譯
- `store/useAppStore.ts`：全域語言與訊息資料

## 六、環境與啟動

1. 安裝
```bash
npm install
```

2. 啟動 Expo
```bash
npm run start:clear
```

3. Android Native
```bash
npm run android
```

4. 型別檢查
```bash
npx tsc --noEmit
```

## 七、Release 與產物

建議一鍵打包（含鎖檔修復）：
```bash
npm run build:release:apk
```

這版 release 相關設定：
- `newArchEnabled=false`
- `app.json` splash icon 指向新版 `assets/icon.png`
- Android native `splashscreen_logo.png` 已同步替換

只修鎖檔（`.git` / `.gradle`）：
```bash
npm run fix:locks
```

若 `.git/index.lock` 權限被破壞（需系統管理員）：
```bash
npm run fix:git:acl:admin
```

APK（Release）：
```bash
cd android
gradlew.bat assembleRelease
```

輸出路徑：
- `android/app/build/outputs/apk/release/app-release.apk`

AAB（上架建議）：
```bash
cd android
gradlew.bat bundleRelease
```

輸出路徑：
- `android/app/build/outputs/bundle/release/app-release.aab`

## 八、部署注意事項

- `android/gradle.properties` 的 `reactNativeArchitectures=arm64-v8a` 不可更改。
- 目前 release build 使用 debug signing，僅適合測試分發。
- 若要上 Google Play，需改為正式 keystore 簽章。
- App icon 更新後若手機不顯示新圖示，請先移除舊版 App 再安裝。
- 若 Windows 發生 Gradle transforms lock，請優先使用 `npm run build:release:apk`（已固定單工參數與多快取 fallback 路徑）。

## 九、已知問題與建議

- STT 品質與速度依賴手機語音服務與網路。
- queue 為記憶體型，關閉 App 後未處理佇列不保留。

## 十、建議下一步

1. 補正式簽章（keystore）與 Play Store 上架設定。
2. 清理所有 UI 文字編碼與 i18n 結構化。
3. 為 MyMemory 加入 timeout/retry/backoff。
4. 補 E2E smoke test（文字/語音/佇列流程）。
