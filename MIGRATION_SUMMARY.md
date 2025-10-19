# Chrome Built-in AI 遷移總結

## 概覽

已成功將 Synapse Extension 從舊的 `window.ai` mock 實作遷移到新的 **Chrome Built-in AI (Gemini Nano)** Prompt API。

## 變更內容

### 1. 類型定義 (`src/lib/types.ts`)

新增了完整的 Chrome Built-in AI 類型定義:

- ✅ `AIModelAvailability` - 模型可用性狀態
- ✅ `AILanguageModelCreateOptions` - 會話創建選項
- ✅ `AILanguageModelPromptOptions` - 提示選項(支援結構化輸出)
- ✅ `AILanguageModelSession` - AI 會話介面
- ✅ `AILanguageModel` - 主要 API 介面

### 2. 全域聲明 (`src/lib/global.d.ts`)

新增了 `window.LanguageModel` 的全域類型聲明,同時保留了向後相容的 `window.ai` 支援。

### 3. 核心功能更新

#### `src/lib/ai/index.ts`

- ✅ **`isAIAvailable()`** - 檢查 AI 可用性
- ✅ **`createAISession()`** - 創建 AI 會話,支援:
  - 模型下載狀態檢測
  - 自動錯誤處理
  - 資源清理
- ✅ **Mock 實作** - 當真實 API 不可用時自動降級
- ✅ 完整的錯誤訊息和使用指南

#### `src/lib/ai/summarize.ts`

- ✅ 使用新的 `createAISession()` API
- ✅ 改進的錯誤處理
- ✅ 自動資源清理

#### `src/lib/ai/chat.ts`

- ✅ 使用新的 `createAISession()` API
- ✅ 更好的錯誤恢復機制
- ✅ 保持用戶對話狀態

### 4. 進階功能 (`src/lib/ai/session-manager.ts`)

全新的進階會話管理工具:

- ✅ **`createAdvancedSession()`** - 創建自定義參數的會話
- ✅ **`promptWithStreaming()`** - 串流回應支援
- ✅ **`promptWithStructuredOutput()`** - JSON Schema 約束輸出
- ✅ **`checkSessionUsage()`** - 資源使用監控
- ✅ **`resetSessionContext()`** - 重置會話上下文
- ✅ **`AISessionPool`** - 會話池管理器
- ✅ **`waitForModelReady()`** - 模型下載進度監控

### 5. 文檔

#### `src/lib/ai/USAGE.md`

完整的使用指南,包括:

- 系統需求
- 啟用步驟
- 基本用法範例
- 進階功能教程
- API 參考
- 疑難排解
- 最佳實踐

#### `src/lib/ai/examples.ts`

9 個實用範例:

1. 基本用法
2. 摘要網頁
3. 互動式對話
4. 串流回應
5. 結構化輸出
6. 會話池管理
7. 資源管理
8. 等待模型就緒
9. 完整 UI 整合

## API 對照表

### 舊 API (window.ai) vs 新 API (window.LanguageModel)

| 功能 | 舊 API | 新 API |
|------|--------|--------|
| 檢查可用性 | `window.ai.canCreateGenericSession()` | `window.LanguageModel.availability()` |
| 創建會話 | `window.ai.createGenericSession()` | `window.LanguageModel.create(options)` |
| 發送提示 | `session.prompt(text)` | `session.prompt(text, options)` |
| 串流回應 | ❌ 不支援 | ✅ `session.promptStreaming()` |
| 結構化輸出 | ❌ 不支援 | ✅ `responseConstraint` 選項 |
| 資源清理 | `session.destroy()` (可選) | `session.destroy()` (必須) |
| 會話克隆 | ❌ 不支援 | ✅ `session.clone()` |
| 資源監控 | ❌ 不支援 | ✅ `inputUsage` / `inputQuota` |

## 遷移指南

### 對於現有程式碼

**之前:**

```typescript
if (!window.ai || !window.ai.canCreateGenericSession) {
    throw new Error("AI not available");
}
const session = await window.ai.createGenericSession();
const result = await session.prompt(text);
```

**現在:**

```typescript
import { isAIAvailable, createAISession } from './lib/ai';

if (!await isAIAvailable()) {
    throw new Error("AI not available");
}
const session = await createAISession();
const result = await session.prompt(text);
if (session.destroy) {
    session.destroy();
}
```

### 向後相容性

✅ Mock 實作會自動處理 API 不可用的情況,確保開發體驗順暢。

## 系統需求

### 硬體

- **GPU**: >4 GB VRAM **或**
- **CPU**: 16 GB RAM + 4 核心

### 軟體

- Chrome 138+ 或 Canary
- macOS 13+ / Windows 10+ / Linux / ChromeOS
- 22 GB 可用儲存空間

### 啟用方法

1. 訪問 `chrome://flags/#optimization-guide-on-device-model`
2. 訪問 `chrome://flags/#prompt-api-for-gemini-nano`
3. 將兩者設為 "Enabled"
4. 重啟 Chrome

## 測試

### 驗證安裝

在 Console 執行:

```javascript
window.LanguageModel?.availability().then(console.log);
// 應該返回: "available", "downloadable", "downloading", 或 "unavailable"
```

### 執行範例

```javascript
// 在頁面中加載範例檔案後
import { examples } from './lib/ai/examples';
await examples.basicUsage();
```

## 已知限制

1. **用戶互動要求**: 首次下載模型必須由用戶操作觸發
2. **行動裝置**: 目前不支援 Android/iOS
3. **語言支援**: Chrome 140+ 支援英文、西班牙文、日文
4. **API 狀態**: 實驗性功能,API 可能變更

## 效能考量

### 最佳實踐

1. ✅ 重複使用會話而非頻繁創建
2. ✅ 使用會話池管理多個並發請求
3. ✅ 監控 token 使用量,適時重置會話
4. ✅ 總是調用 `destroy()` 清理資源
5. ✅ 使用串流處理長回應

### 資源管理範例

```typescript
const pool = new AISessionPool(3);
const session = await pool.getSession();
// ... 使用會話
pool.releaseSession(session);  // 而非 destroy()
```

## 進階功能亮點

### 1. 串流回應

```typescript
await promptWithStreaming(session, prompt, (chunk) => {
    updateUI(chunk);  // 即時更新
});
```

### 2. 結構化輸出

```typescript
const result = await promptWithStructuredOutput(session, prompt, {
    type: "object",
    properties: {
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
    }
});
```

### 3. 資源監控

```typescript
const { usage, quota, percentUsed } = checkSessionUsage(session);
if (percentUsed > 80) {
    session = await resetSessionContext(session);
}
```

## 未來擴展

可以考慮的功能:

- 🔄 多模態輸入 (圖片、音訊) - EPP 參與者已可用
- 🔄 Writer API / Rewriter API 整合
- 🔄 Translator API 整合 (Chrome 138+ 已穩定)
- 🔄 Summarizer API 整合 (Chrome 138+ 已穩定)

## 相關資源

- [Chrome Built-in AI 官方文檔](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API Explainer](https://github.com/explainers-by-googlers/prompt-api)
- [使用指南](./src/lib/ai/USAGE.md)
- [範例程式碼](./src/lib/ai/examples.ts)

## 結論

✅ 遷移完成!現在可以:

1. 使用最新的 Chrome Built-in AI API
2. 獲得更好的錯誤處理和資源管理
3. 使用進階功能(串流、結構化輸出、會話池)
4. 在 API 不可用時自動降級到 mock 實作
5. 參考完整的文檔和範例

所有 TypeScript 編譯錯誤已解決,程式碼準備就緒! 🎉
