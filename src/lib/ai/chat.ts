import { PageContent, StructuredData, ChatResponse } from '../types';
import { getChatPrompt } from './prompt/chat';

/**
 * Interactive chat with Gemini for refining summaries and structured data
 */
export async function chatWithAI(
    pageContent: PageContent,
    currentSummary: string,
    currentStructuredData: StructuredData,
    userMessage: string
): Promise<ChatResponse> {
    if (!window.ai || !window.ai.canCreateGenericSession) {
        throw new Error("Gemini Nano (window.ai) is not available.");
    }

    // Create a session to handle the interactive chat request
    const session = await window.ai.createGenericSession();
    const promptText = getChatPrompt(
        pageContent,
        currentSummary,
        currentStructuredData,
        userMessage
    );

    const result = await session.prompt(promptText);
    try {
        const jsonResult = JSON.parse(result);
        return {
            summary: jsonResult.summary,
            structuredData: jsonResult.structuredData,
            aiResponse:
                jsonResult.aiResponse || "好的，我已嘗試根據您的指示進行調整。",
        };
    } catch (e) {
        console.error("無法解析 Gemini Nano 的對話 JSON 回應:", result, e);
        // If parsing fails, return the previous state so the calling UI can
        // present the original content and an informative aiResponse message.
        return {
            summary: currentSummary,
            structuredData: currentStructuredData,
            aiResponse: "抱歉，我無法理解您的指令或解析我的回應。請再試一次。",
        };
    }
}
