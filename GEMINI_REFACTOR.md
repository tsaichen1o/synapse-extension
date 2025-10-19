# GeminiAI 重構總結

## 變更摘要

已將 `session-manager.ts` 從函數式 API 重構為物件導向設計。

### 之前的問題

1. ❌ 函數需要傳遞 `session` 參數,不夠直觀
2. ❌ `AILanguageModelSession` 是介面,不能實例化
3. ❌ 沒有被使用的函數卻標記為 `@deprecated`
4. ❌ Has-A 關係不清晰

### 新設計

✅ **`GeminiAI` 類別** - 封裝原生 session,提供物件導向 API  
✅ **`GeminiAIPool` 類別** - 管理 GeminiAI 實例池  
✅ **清晰的命名** - `GeminiAI` 代表 AI 實例,不是 session  
✅ **簡潔的 API** - 所有功能都是實例方法  

---

## 新的 API 設計

### GeminiAI 類別

```typescript
class GeminiAI {
    // 靜態方法
    static async create(options?): Promise<GeminiAI>
    
    // 實例方法
    async prompt(text: string): Promise<string>
    async promptStreaming(prompt: string, onChunk: (chunk: string) => void): Promise<string>
    async promptStructured<T>(prompt: string, schema: object): Promise<T>
    getUsage(): { usage: number, quota: number, percentUsed: number }
    isUsageHigh(threshold?: number): boolean
    async clone(): Promise<GeminiAI>
    destroy(): void
    getNativeSession(): AILanguageModelSession
}
```

### GeminiAIPool 類別

```typescript
class GeminiAIPool {
    constructor(maxInstances?: number)
    async getInstance(options?): Promise<GeminiAI>
    release(ai: GeminiAI): void
    size(): number
    destroyAll(): void
}
```

---

## 使用對比

### 舊的函數式 API (已移除)

```typescript
import { createAdvancedSession, promptWithStreaming } from './session-manager';

const session = await createAdvancedSession();
const result = await promptWithStreaming(session, prompt, onChunk);
session.destroy();
```

問題:

- 需要傳遞 `session` 參數
- 函數名稱不夠直觀
- `session` 這個命名容易混淆

### 新的物件導向 API

```typescript
import { GeminiAI } from './session-manager';

const ai = await GeminiAI.create();
const result = await ai.promptStreaming(prompt, onChunk);
ai.destroy();
```

優點:

- ✅ 清晰的物件導向設計
- ✅ 方法調用更直觀
- ✅ `GeminiAI` 明確表示這是 AI 實例
- ✅ 符合單一職責原則

---

## 檔案結構

```
src/lib/ai/
├── session-manager.ts          # GeminiAI 和 GeminiAIPool 類別
├── GEMINI_GUIDE.md            # GeminiAI 使用指南 (新)
├── index.ts                   # 基本 AI 功能
├── chat.ts                    # 對話功能
├── summarize.ts               # 摘要功能
├── USAGE.md                   # 通用使用指南
└── examples.ts                # 範例程式碼
```

---

## 遷移指南

### 如果你之前使用過這些函數

**無需遷移!** 這些函數從未在專案中被使用過,所以沒有遷移問題。

### 新專案應該使用

```typescript
import { GeminiAI, GeminiAIPool } from './lib/ai/session-manager';

// 單次使用
const ai = await GeminiAI.create();
await ai.prompt('...');
ai.destroy();

// 批量/並發使用
const pool = new GeminiAIPool(3);
const ai = await pool.getInstance();
// 使用 ai...
pool.release(ai);
pool.destroyAll();
```

---

## 設計原則

### 1. 單一職責

- `GeminiAI` - 封裝單個 AI 實例的所有操作
- `GeminiAIPool` - 管理多個實例的生命週期
- `waitForModelReady` - 獨立的工具函數

### 2. 封裝

```typescript
class GeminiAI {
    private nativeSession: AILanguageModelSession;  // 隱藏內部實作
    // ...
}
```

原生 session 被封裝在類別內部,外部通過高層方法訪問。

### 3. 組合優於繼承

```typescript
class GeminiAI {
    private nativeSession: AILanguageModelSession;  // 組合
}
```

`GeminiAI` 組合原生 session,而不是試圖擴展它。

### 4. 清晰的命名

- `GeminiAI` - 表示 AI 實例
- `GeminiAIPool` - 表示 AI 實例池
- 不使用 `Session` 避免與原生 API 混淆

---

## 完整範例

### 基本使用

```typescript
import { GeminiAI } from './lib/ai/session-manager';

const ai = await GeminiAI.create({
    temperature: 0.7,
    systemPrompt: '你是一個友善的助手'
});

const answer = await ai.prompt('什麼是 TypeScript?');
console.log(answer);

ai.destroy();
```

### 串流回應

```typescript
const ai = await GeminiAI.create();

await ai.promptStreaming(
    '寫一篇關於 AI 的文章',
    (chunk) => console.log(chunk)
);

ai.destroy();
```

### 結構化輸出

```typescript
const ai = await GeminiAI.create();

const result = await ai.promptStructured(
    '分析這段文字...',
    {
        type: "object",
        properties: {
            sentiment: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
        }
    }
);

console.log(result.sentiment);
console.log(result.keywords);

ai.destroy();
```

### 使用池化

```typescript
import { GeminiAIPool } from './lib/ai/session-manager';

const pool = new GeminiAIPool(3);

for (const task of tasks) {
    const ai = await pool.getInstance();
    const result = await ai.prompt(task);
    pool.release(ai);
}

pool.destroyAll();
```

---

## 效益

### 1. 更好的可讀性

```typescript
// 之前
const result = await promptWithStreaming(session, prompt, onChunk);

// 現在
const result = await ai.promptStreaming(prompt, onChunk);
```

### 2. 更少的參數傳遞

所有方法都在實例上,不需要傳遞 session。

### 3. 更清晰的責任劃分

- 創建: `GeminiAI.create()`
- 使用: `ai.prompt()`, `ai.promptStreaming()` 等
- 管理: `ai.getUsage()`, `ai.isUsageHigh()`
- 清理: `ai.destroy()`

### 4. 更好的類型推斷

```typescript
const result = await ai.promptStructured<{
    title: string;
    tags: string[];
}>(prompt, schema);

// result.title 和 result.tags 都有正確的類型!
```

---

## 注意事項

### 1. 原生 Session 訪問

如需直接訪問原生 session:

```typescript
const ai = await GeminiAI.create();
const nativeSession = ai.getNativeSession();
// 使用原生 API...
```

### 2. 資源管理

總是記得調用 `destroy()`:

```typescript
const ai = await GeminiAI.create();
try {
    // 使用 ai
} finally {
    ai.destroy();
}
```

### 3. 池化使用

使用 `release()` 而非 `destroy()`:

```typescript
const pool = new GeminiAIPool();
const ai = await pool.getInstance();
try {
    // 使用 ai
} finally {
    pool.release(ai);  // 不是 ai.destroy()
}
```

---

## 文檔

- **[GEMINI_GUIDE.md](./GEMINI_GUIDE.md)** - GeminiAI 完整使用指南
- **[USAGE.md](./USAGE.md)** - Chrome Built-in AI 通用指南
- **[examples.ts](./examples.ts)** - 實用範例程式碼

---

## 總結

✅ 重構完成!新的 `GeminiAI` 類別提供:

1. 清晰的物件導向 API
2. 更好的封裝和抽象
3. 簡潔直觀的方法調用
4. 完整的類型安全
5. 靈活的池化管理

**開始使用:** 參考 [GEMINI_GUIDE.md](./GEMINI_GUIDE.md) 📚
