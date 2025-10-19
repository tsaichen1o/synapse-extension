# Chrome Built-in AI 快速參考

## 🚀 快速開始

### 1. 啟用 AI 功能

```
chrome://flags/#optimization-guide-on-device-model  → Enabled
chrome://flags/#prompt-api-for-gemini-nano          → Enabled
```

重啟 Chrome

### 2. 基本使用

```typescript
import { createAISession } from './lib/ai';

const session = await createAISession();
const response = await session.prompt('你的問題');
session.destroy?.();
```

---

## 📋 常用 API

### 檢查可用性

```typescript
import { isAIAvailable } from './lib/ai';
const available = await isAIAvailable();
```

### 摘要網頁

```typescript
import { getPageContent, summarizeContentWithAI } from './lib/ai';

const pageContent = await getPageContent();
const summary = await summarizeContentWithAI(pageContent);
```

### 互動對話

```typescript
import { chatWithAI } from './lib/ai';

const response = await chatWithAI(
    pageContent,
    currentSummary,
    currentStructuredData,
    '請改為更簡潔的版本'
);
```

---

## 🔥 進階功能

### 串流回應

```typescript
import { createAdvancedSession, promptWithStreaming } from './lib/ai/session-manager';

const session = await createAdvancedSession();
await promptWithStreaming(session, prompt, (chunk) => {
    console.log(chunk);  // 即時顯示
});
```

### 結構化輸出

```typescript
import { promptWithStructuredOutput } from './lib/ai/session-manager';

const result = await promptWithStructuredOutput(session, prompt, {
    type: "object",
    properties: {
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
    }
});
```

### 會話池

```typescript
import { AISessionPool } from './lib/ai/session-manager';

const pool = new AISessionPool(3);
const session = await pool.getSession();
// 使用...
pool.releaseSession(session);
pool.destroyAll();  // 清理
```

### 資源監控

```typescript
import { checkSessionUsage } from './lib/ai/session-manager';

const { usage, quota, percentUsed } = checkSessionUsage(session);
console.log(`使用: ${percentUsed.toFixed(1)}%`);
```

---

## 💡 最佳實踐

### ✅ DO

```typescript
// 1. 重複使用會話
const session = await createAISession();
await session.prompt('問題 1');
await session.prompt('問題 2');
session.destroy?.();

// 2. 使用會話池
const pool = new AISessionPool(3);

// 3. 監控資源
if (checkSessionUsage(session).percentUsed > 80) {
    session = await resetSessionContext(session);
}

// 4. 錯誤處理
try {
    await session.prompt(text);
} catch (error) {
    console.error('AI 錯誤:', error);
}
```

### ❌ DON'T

```typescript
// 1. 不要頻繁創建會話
for (let i = 0; i < 10; i++) {
    const session = await createAISession();  // ❌ 太慢
}

// 2. 不要忘記清理
const session = await createAISession();
// ... 使用
// ❌ 忘記調用 destroy()

// 3. 不要在頁面載入時自動下載
// ❌ 需要用戶互動才能觸發下載
window.addEventListener('load', async () => {
    await createAISession();  // 可能失敗
});
```

---

## 🔧 疑難排解

### API 不可用

```typescript
// 檢查
if (!window.LanguageModel) {
    console.error('請使用 Chrome 138+ 並啟用 flags');
}

// 查看狀態
const status = await window.LanguageModel.availability();
console.log(status);  // unavailable / downloadable / downloading / available
```

### 模型下載失敗

```typescript
import { waitForModelReady } from './lib/ai/session-manager';

const ready = await waitForModelReady((status) => {
    console.log('狀態:', status);
}, 60000);
```

### 記憶體/性能問題

```typescript
// 定期重置會話
const MAX_USAGE = 80;
if (checkSessionUsage(session).percentUsed > MAX_USAGE) {
    session = await resetSessionContext(session);
}

// 使用會話池限制並發
const pool = new AISessionPool(2);  // 最多 2 個
```

---

## 📊 狀態檢查

### 快速診斷

在 Console 執行:

```javascript
// 1. 檢查 API
console.log('API:', !!window.LanguageModel ? '✅' : '❌');

// 2. 檢查狀態
window.LanguageModel?.availability().then(s => console.log('狀態:', s));

// 3. 檢查參數
window.LanguageModel?.params().then(console.log);
```

---

## 📦 導入參考

```typescript
// 基本功能
import {
    isAIAvailable,
    createAISession,
    getPageContent,
    summarizeContentWithAI,
    chatWithAI,
} from './lib/ai';

// 進階功能
import {
    createAdvancedSession,
    promptWithStreaming,
    promptWithStructuredOutput,
    checkSessionUsage,
    resetSessionContext,
    AISessionPool,
    waitForModelReady,
} from './lib/ai/session-manager';

// 類型
import type {
    AISession,
    AILanguageModel,
    AILanguageModelSession,
    AIModelAvailability,
    PageContent,
    SummaryResponse,
    ChatResponse,
} from './lib/types';
```

---

## 🎯 常見場景

### 場景 1: 一次性摘要

```typescript
const pageContent = await getPageContent();
const summary = await summarizeContentWithAI(pageContent);
console.log(summary.summary);
```

### 場景 2: 多輪對話

```typescript
const session = await createAISession();
const resp1 = await session.prompt('你好');
const resp2 = await session.prompt('請繼續');
session.destroy?.();
```

### 場景 3: 批量處理

```typescript
const pool = new AISessionPool(3);
const tasks = ['任務1', '任務2', '任務3'];

for (const task of tasks) {
    const session = await pool.getSession();
    await session.prompt(task);
    pool.releaseSession(session);
}

pool.destroyAll();
```

### 場景 4: 長文本串流

```typescript
const session = await createAdvancedSession();
let fullText = '';

await promptWithStreaming(session, '寫一篇長文', (chunk) => {
    fullText += chunk;
    updateUI(chunk);  // 即時更新
});

session.destroy();
```

---

## 📚 更多資源

- [完整使用指南](./src/lib/ai/USAGE.md)
- [範例程式碼](./src/lib/ai/examples.ts)
- [遷移總結](./MIGRATION_SUMMARY.md)
- [Chrome 官方文檔](https://developer.chrome.com/docs/ai/built-in)

---

## ⚡ 速查表

| 功能 | API |
|------|-----|
| 檢查可用 | `isAIAvailable()` |
| 創建會話 | `createAISession()` |
| 進階會話 | `createAdvancedSession(options)` |
| 發送提示 | `session.prompt(text)` |
| 串流回應 | `promptWithStreaming(session, text, callback)` |
| 結構化輸出 | `promptWithStructuredOutput(session, text, schema)` |
| 檢查使用量 | `checkSessionUsage(session)` |
| 重置上下文 | `resetSessionContext(session)` |
| 會話池 | `new AISessionPool(max)` |
| 等待就緒 | `waitForModelReady(callback, timeout)` |
| 摘要網頁 | `summarizeContentWithAI(pageContent)` |
| 互動對話 | `chatWithAI(page, summary, data, message)` |
