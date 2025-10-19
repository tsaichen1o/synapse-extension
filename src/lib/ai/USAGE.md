# Chrome Built-in AI (Gemini Nano) 使用指南

本文檔說明如何在 Synapse Extension 中使用 Chrome Built-in AI API。

## 目錄

1. [系統需求](#系統需求)
2. [啟用 AI 功能](#啟用-ai-功能)
3. [基本使用](#基本使用)
4. [進階功能](#進階功能)
5. [API 參考](#api-參考)

---

## 系統需求

### 硬體需求

必須滿足以下**其中一個**條件:

- **GPU**: 超過 4 GB VRAM
- **CPU**: 16 GB RAM + 4 個 CPU 核心

### 軟體需求

- **作業系統**: Windows 10/11, macOS 13+ (Ventura), Linux, 或 ChromeOS
- **瀏覽器**: Chrome 138+ 或 Chrome Canary
- **儲存空間**: 至少 22 GB 可用空間
- **網路**: 首次下載模型需要無限制的網路連線

### 語言支援

從 Chrome 140 開始支援:

- 英文 (en)
- 西班牙文 (es)
- 日文 (ja)

---

## 啟用 AI 功能

### 1. 啟用 Chrome Flags

在 Chrome 中訪問以下網址並啟用這些功能:

- chrome://flags/#optimization-guide-on-device-model
- chrome://flags/#prompt-api-for-gemini-nano

將兩個選項都設置為 **"Enabled"**,然後重啟 Chrome。

### 2. 驗證安裝

在開發者工具的 Console 中執行:

```javascript
if (window.LanguageModel) {
    window.LanguageModel.availability().then(status => {
        console.log('AI 狀態:', status);
    });
} else {
    console.log('LanguageModel API 不可用');
}
```

可能的狀態:

- `"available"` - ✅ 可以使用
- `"downloadable"` - ⏬ 需要下載模型 (需要用戶互動)
- `"downloading"` - ⏳ 正在下載
- `"unavailable"` - ❌ 不支援

---

## 基本使用

### 檢查 AI 可用性

```typescript
import { isAIAvailable } from './lib/ai';

const available = await isAIAvailable();
if (available) {
    console.log('AI 功能可用!');
}
```

### 創建 AI 會話

```typescript
import { createAISession } from './lib/ai';

try {
    const session = await createAISession();
    const response = await session.prompt('請用中文介紹 TypeScript');
    console.log(response);
    
    // 記得清理資源
    if (session.destroy) {
        session.destroy();
    }
} catch (error) {
    console.error('AI 會話創建失敗:', error);
}
```

### 摘要網頁內容

```typescript
import { getPageContent, summarizeContentWithAI } from './lib/ai';

// 1. 提取當前頁面內容
const pageContent = await getPageContent();

// 2. 使用 AI 生成摘要
const summary = await summarizeContentWithAI(pageContent);

console.log('摘要:', summary.summary);
console.log('結構化資料:', summary.structuredData);
```

### 互動式對話

```typescript
import { chatWithAI } from './lib/ai';

const response = await chatWithAI(
    pageContent,
    currentSummary,
    currentStructuredData,
    '請將摘要改為更簡潔的版本'
);

console.log('AI 回應:', response.aiResponse);
console.log('更新後的摘要:', response.summary);
```

---

## 進階功能

### 1. 串流回應

適用於長回應,可以即時顯示部分結果:

```typescript
import { createAdvancedSession, promptWithStreaming } from './lib/ai/session-manager';

const session = await createAdvancedSession({
    temperature: 0.8,
    topK: 50,
});

await promptWithStreaming(
    session,
    '請寫一篇關於 AI 的長文章',
    (chunk) => {
        // 每次收到新的文字片段時執行
        console.log('新片段:', chunk);
        // 更新 UI 顯示
    }
);

session.destroy();
```

### 2. 結構化輸出 (JSON Schema)

強制 AI 返回符合特定格式的 JSON:

```typescript
import { createAdvancedSession, promptWithStructuredOutput } from './lib/ai/session-manager';

const session = await createAdvancedSession();

const schema = {
    type: "object",
    properties: {
        title: { type: "string" },
        tags: { 
            type: "array",
            items: { type: "string" }
        },
        sentiment: { 
            type: "string",
            enum: ["positive", "negative", "neutral"]
        }
    },
    required: ["title", "tags", "sentiment"]
};

const result = await promptWithStructuredOutput(
    session,
    '分析這篇文章: ' + pageContent.fullText,
    schema
);

console.log('標題:', result.title);
console.log('標籤:', result.tags);
console.log('情感:', result.sentiment);

session.destroy();
```

### 3. 會話池管理

重複使用 AI 會話以提高性能:

```typescript
import { AISessionPool } from './lib/ai/session-manager';

// 創建會話池 (最多保留 3 個會話)
const sessionPool = new AISessionPool(3);

// 使用會話
const session = await sessionPool.getSession({
    temperature: 0.7,
    systemPrompt: '你是一個專業的摘要助手'
});

const response = await session.prompt('請摘要這段文字...');

// 釋放會話回池中 (而不是銷毀)
sessionPool.releaseSession(session);

// 清理所有會話
sessionPool.destroyAll();
```

### 4. 監控資源使用

```typescript
import { checkSessionUsage } from './lib/ai/session-manager';

const session = await createAdvancedSession();

// 執行一些操作...
await session.prompt('...');

// 檢查使用情況
const usage = checkSessionUsage(session);
console.log(`使用: ${usage.usage} / ${usage.quota} tokens (${usage.percentUsed.toFixed(1)}%)`);

if (usage.percentUsed > 80) {
    console.warn('會話快滿了,考慮重置或創建新會話');
}
```

### 5. 重置會話上下文

保留初始設定但清除對話歷史:

```typescript
import { resetSessionContext } from './lib/ai/session-manager';

let session = await createAdvancedSession({
    systemPrompt: '你是一個友善的助手',
    temperature: 0.7
});

// 使用一段時間後...
await session.prompt('第一個問題');
await session.prompt('第二個問題');

// 重置上下文 (保留 systemPrompt 和參數)
session = await resetSessionContext(session);

// 現在 AI 不會記得之前的對話
await session.prompt('新的問題');
```

### 6. 等待模型就緒

監控模型下載進度:

```typescript
import { waitForModelReady } from './lib/ai/session-manager';

const ready = await waitForModelReady(
    (status) => {
        console.log('當前狀態:', status);
        // 更新 UI 顯示下載進度
    },
    60000 // 最多等待 60 秒
);

if (ready) {
    console.log('模型準備就緒!');
} else {
    console.log('模型無法使用或超時');
}
```

---

## API 參考

### 核心函數

#### `isAIAvailable(): Promise<boolean>`

檢查 AI 功能是否可用。

**返回**: `true` 如果可用或可下載，否則 `false`

---

#### `createAISession(): Promise<AISession>`

創建一個新的 AI 會話。

**返回**: AISession 物件

**拋出錯誤**:

- 如果 LanguageModel API 不可用
- 如果設備不支援
- 如果會話創建失敗

**範例**:

```typescript
const session = await createAISession();
```

---

#### `summarizeContentWithAI(pageContent: PageContent): Promise<SummaryResponse>`

使用 AI 摘要網頁內容。

**參數**:

- `pageContent`: 要摘要的頁面內容

**返回**: 包含摘要和結構化資料的物件

---

#### `chatWithAI(pageContent, currentSummary, currentStructuredData, userMessage): Promise<ChatResponse>`

與 AI 進行互動式對話以改進摘要。

**參數**:

- `pageContent`: 原始頁面內容
- `currentSummary`: 當前的摘要文字
- `currentStructuredData`: 當前的結構化資料
- `userMessage`: 用戶的指令

**返回**: 包含更新的摘要、資料和 AI 回應的物件

---

### 進階會話管理

#### `createAdvancedSession(options?): Promise<AILanguageModelSession>`

創建具有自定義參數的進階會話。

**選項**:

- `temperature?: number` - 控制隨機性 (0.0-2.0)
- `topK?: number` - 候選詞數量
- `systemPrompt?: string` - 系統提示詞

---

#### `promptWithStreaming(session, prompt, onChunk): Promise<string>`

獲取串流回應。

**參數**:

- `session`: AI 會話
- `prompt`: 提示文字
- `onChunk`: 每個片段的回調函數

---

#### `promptWithStructuredOutput<T>(session, prompt, schema): Promise<T>`

使用 JSON Schema 約束輸出格式。

**參數**:

- `session`: AI 會話
- `prompt`: 提示文字
- `schema`: JSON Schema 物件

---

## 開發模式

如果 Chrome Built-in AI 不可用,系統會自動使用模擬實作:

```typescript
// 模擬回應會包含提示訊息
{
    summary: "這是一個模擬的摘要回應。請啟用真實的 Chrome Built-in AI 來獲得實際功能。",
    structuredData: {
        note: "Mock data - enable real AI for actual results",
        timestamp: "2025-10-19T..."
    }
}
```

在 Console 中會看到警告訊息,提示如何啟用真實的 AI 功能。

---

## 疑難排解

### 問題: "LanguageModel API is not available"

**解決方案**:

1. 確認使用 Chrome 138+ 或 Canary
2. 啟用必要的 Chrome flags
3. 重啟瀏覽器

### 問題: "AI model is unavailable on this device"

**解決方案**:

1. 檢查硬體需求 (4GB+ VRAM 或 16GB+ RAM)
2. 確保有 22GB 可用儲存空間
3. 確認作業系統版本

### 問題: 模型下載失敗

**解決方案**:

1. 確保網路連線穩定
2. 確保使用無限制的網路連線 (非計量連線)
3. 檢查防火牆設定

### 問題: Session 創建需要用戶互動

**解決方案**:

- 確保在用戶點擊按鈕等互動事件中調用 `createAISession()`
- 不要在頁面載入時自動創建會話

---

## 最佳實踐

1. **資源管理**: 總是在使用後調用 `session.destroy()`
2. **錯誤處理**: 使用 try-catch 包裹所有 AI 操作
3. **用戶互動**: 在需要下載模型時從用戶操作觸發
4. **會話重用**: 使用會話池來提高性能
5. **監控使用量**: 定期檢查 token 使用情況,避免超出配額

---

## 更多資源

- [Chrome Built-in AI 官方文檔](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API GitHub](https://github.com/explainers-by-googlers/prompt-api)
- [Google AI Guidelines](https://ai.google.dev/gemini-api/docs/ai-guidelines)
