/**
 * 範例: 如何在 Synapse Extension 中使用 Chrome Built-in AI
 * 
 * 這個檔案展示了從舊 API (window.ai) 遷移到新 API (window.LanguageModel) 的範例
 */

// ===== 範例 1: 基本用法 - 檢查可用性並創建會話 =====

import { isAIAvailable, createAISession } from './index';

async function example1_BasicUsage() {
    console.log('=== 範例 1: 基本用法 ===');

    // 1. 檢查 AI 是否可用
    const available = await isAIAvailable();
    if (!available) {
        console.error('AI 功能不可用,請檢查系統需求和 Chrome flags');
        return;
    }

    // 2. 創建會話
    try {
        const session = await createAISession();

        // 3. 發送提示
        const response = await session.prompt('請用一句話解釋什麼是 TypeScript');
        console.log('AI 回應:', response);

        // 4. 清理資源
        if (session.destroy) {
            session.destroy();
        }
    } catch (error) {
        console.error('會話創建或提示失敗:', error);
    }
}

// ===== 範例 2: 摘要網頁內容 =====

import { getPageContent, summarizeContentWithAI } from './index';

async function example2_SummarizeCurrentPage() {
    console.log('=== 範例 2: 摘要網頁 ===');

    try {
        // 1. 提取當前頁面內容
        const pageContent = await getPageContent();
        console.log('頁面標題:', pageContent.title);
        console.log('文字長度:', pageContent.fullText?.length);

        // 2. 使用 AI 生成摘要
        const summary = await summarizeContentWithAI(pageContent);

        console.log('摘要:', summary.summary);
        console.log('結構化資料:', JSON.stringify(summary.structuredData, null, 2));
    } catch (error) {
        console.error('摘要生成失敗:', error);
    }
}

// ===== 範例 3: 互動式對話 =====

import { chatWithAI } from './chat';
import type { PageContent, StructuredData } from '../types';

async function example3_InteractiveChat() {
    console.log('=== 範例 3: 互動式對話 ===');

    try {
        // 假設我們已經有了頁面內容和初始摘要
        const pageContent = await getPageContent();
        const initialSummary = await summarizeContentWithAI(pageContent);

        // 用戶要求改進摘要
        const userRequest = '請將摘要改為更簡潔的版本,不超過 50 字';

        const response = await chatWithAI(
            pageContent,
            initialSummary.summary,
            initialSummary.structuredData,
            userRequest
        );

        console.log('AI 回應:', response.aiResponse);
        console.log('更新的摘要:', response.summary);
    } catch (error) {
        console.error('對話失敗:', error);
    }
}

// ===== 範例 4: 進階功能 - 串流回應 =====

import {
    createAdvancedSession,
    promptWithStreaming
} from './session-manager';

async function example4_StreamingResponse() {
    console.log('=== 範例 4: 串流回應 ===');

    try {
        const session = await createAdvancedSession({
            temperature: 0.8,
            topK: 50,
            systemPrompt: '你是一個專業的技術寫作助手'
        });

        console.log('開始串流...');
        let streamedText = '';

        await promptWithStreaming(
            session,
            '請寫一篇 200 字關於機器學習的介紹',
            (chunk: string) => {
                streamedText += chunk;
                // 在實際應用中,這裡會更新 UI
                console.log(chunk); // 改用 console.log
            }
        );

        console.log('\n完整回應:', streamedText);
        session.destroy();
    } catch (error) {
        console.error('串流失敗:', error);
    }
}

// ===== 範例 5: 結構化輸出 (JSON Schema) =====

import { promptWithStructuredOutput } from './session-manager';

async function example5_StructuredOutput() {
    console.log('=== 範例 5: 結構化輸出 ===');

    try {
        const session = await createAdvancedSession();

        // 定義預期的輸出格式
        const schema = {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "文章標題"
                },
                keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "關鍵字列表"
                },
                sentiment: {
                    type: "string",
                    enum: ["positive", "negative", "neutral"],
                    description: "整體情感"
                },
                summary: {
                    type: "string",
                    description: "簡短摘要"
                }
            },
            required: ["title", "keywords", "sentiment", "summary"]
        };

        const pageContent = await getPageContent();

        const result = await promptWithStructuredOutput(
            session,
            `分析以下內容並提供結構化資訊:\n標題: ${pageContent.title}\n內容: ${pageContent.fullText?.substring(0, 500)}`,
            schema
        );

        console.log('結構化結果:');
        console.log('- 標題:', result.title);
        console.log('- 關鍵字:', result.keywords);
        console.log('- 情感:', result.sentiment);
        console.log('- 摘要:', result.summary);

        session.destroy();
    } catch (error) {
        console.error('結構化輸出失敗:', error);
    }
}

// ===== 範例 6: 會話池管理 =====

import { AISessionPool } from './session-manager';

async function example6_SessionPool() {
    console.log('=== 範例 6: 會話池管理 ===');

    const sessionPool = new AISessionPool(3); // 最多保留 3 個會話

    try {
        // 模擬多個並發請求
        const tasks = [
            '解釋什麼是 React',
            '解釋什麼是 Vue',
            '解釋什麼是 Angular',
            '解釋什麼是 Svelte'
        ];

        for (const task of tasks) {
            const session = await sessionPool.getSession({
                temperature: 0.7
            });

            console.log(`處理任務: ${task}`);
            const response = await session.prompt(task);
            console.log(`回應: ${response.substring(0, 100)}...`);

            // 釋放會話回池中
            sessionPool.releaseSession(session);
        }
    } catch (error) {
        console.error('會話池操作失敗:', error);
    } finally {
        // 清理所有會話
        sessionPool.destroyAll();
    }
}

// ===== 範例 7: 監控和管理資源 =====

import { checkSessionUsage, resetSessionContext } from './session-manager';

async function example7_ResourceManagement() {
    console.log('=== 範例 7: 資源管理 ===');

    try {
        let session = await createAdvancedSession({
            systemPrompt: '你是一個友善的 AI 助手'
        });

        // 執行一些操作
        await session.prompt('你好');
        await session.prompt('請介紹你自己');

        // 檢查資源使用情況
        const usage = checkSessionUsage(session);
        console.log(`資源使用: ${usage.usage}/${usage.quota} tokens (${usage.percentUsed.toFixed(1)}%)`);

        if (usage.percentUsed > 50) {
            console.log('使用量較高,重置會話上下文...');
            session = await resetSessionContext(session);

            const newUsage = checkSessionUsage(session);
            console.log(`重置後: ${newUsage.usage}/${newUsage.quota} tokens (${newUsage.percentUsed.toFixed(1)}%)`);
        }

        session.destroy();
    } catch (error) {
        console.error('資源管理失敗:', error);
    }
}

// ===== 範例 8: 等待模型就緒 =====

import { waitForModelReady } from './session-manager';
import type { AIModelAvailability } from '../types';

async function example8_WaitForModel() {
    console.log('=== 範例 8: 等待模型就緒 ===');

    const ready = await waitForModelReady(
        (status: AIModelAvailability) => {
            console.log('模型狀態:', status);
            // 在真實應用中,這裡可以更新 UI 顯示下載進度
        },
        60000 // 最多等待 60 秒
    );

    if (ready) {
        console.log('✅ 模型已就緒,可以開始使用!');

        // 現在可以安全地創建會話
        const session = await createAISession();
        // ... 使用會話
        session.destroy?.();
    } else {
        console.log('❌ 模型無法使用或超時');
    }
}

// ===== 範例 9: 完整的 UI 整合範例 =====

/**
 * 這是一個完整的範例,展示如何在 UI 中整合 AI 功能
 */
async function example9_UIIntegration() {
    console.log('=== 範例 9: UI 整合 ===');

    // 步驟 1: 頁面載入時檢查 AI 可用性
    const available = await isAIAvailable();

    // 更新 UI 狀態
    const aiButton = document.getElementById('ai-summarize-btn') as HTMLButtonElement | null;
    if (!available) {
        if (aiButton) {
            aiButton.disabled = true;
            aiButton.title = 'AI 功能不可用,請檢查 Chrome 設定';
        }
        return;
    }

    // 步驟 2: 等待模型就緒 (顯示進度)
    const statusDiv = document.getElementById('ai-status');
    const modelReady = await waitForModelReady(
        (status: AIModelAvailability) => {
            if (statusDiv) {
                statusDiv.textContent = `AI 狀態: ${status}`;
            }
        },
        30000
    );

    if (!modelReady) {
        if (statusDiv) {
            statusDiv.textContent = 'AI 模型無法使用';
        }
        return;
    }

    // 步驟 3: 設置按鈕點擊事件
    if (aiButton) {
        aiButton.addEventListener('click', async () => {
            if (aiButton) {
                aiButton.disabled = true;
                aiButton.textContent = '生成中...';
            }

            try {
                // 提取頁面內容
                const pageContent = await getPageContent();

                // 生成摘要
                const summary = await summarizeContentWithAI(pageContent);

                // 顯示結果
                const resultDiv = document.getElementById('summary-result');
                if (resultDiv) {
                    resultDiv.innerHTML = `
                        <h3>摘要</h3>
                        <p>${summary.summary}</p>
                        <h4>結構化資料</h4>
                        <pre>${JSON.stringify(summary.structuredData, null, 2)}</pre>
                    `;
                }
            } catch (error) {
                console.error('生成摘要失敗:', error);
                alert('生成摘要失敗: ' + (error as Error).message);
            } finally {
                if (aiButton) {
                    aiButton.disabled = false;
                    aiButton.textContent = '生成摘要';
                }
            }
        });
    }
}

// ===== 導出所有範例供測試使用 =====

export const examples = {
    basicUsage: example1_BasicUsage,
    summarizePage: example2_SummarizeCurrentPage,
    interactiveChat: example3_InteractiveChat,
    streamingResponse: example4_StreamingResponse,
    structuredOutput: example5_StructuredOutput,
    sessionPool: example6_SessionPool,
    resourceManagement: example7_ResourceManagement,
    waitForModel: example8_WaitForModel,
    uiIntegration: example9_UIIntegration,
};

// 如果直接執行這個檔案,運行所有範例
if (typeof window !== 'undefined' && window.location.search.includes('run-examples')) {
    console.log('🚀 運行所有 AI 範例...\n');

    (async () => {
        await example1_BasicUsage();
        await example2_SummarizeCurrentPage();
        await example3_InteractiveChat();
        await example4_StreamingResponse();
        await example5_StructuredOutput();
        await example6_SessionPool();
        await example7_ResourceManagement();
        await example8_WaitForModel();
        // example9 需要 DOM 元素,跳過

        console.log('\n✅ 所有範例執行完成!');
    })().catch(console.error);
}
