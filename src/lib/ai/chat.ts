import { PageContent, StructuredData, ChatResponse } from '../types';
import { getChatPrompt } from './prompt/chat';
import { createAISession } from './index';

/**
 * Interactive chat with Chrome Built-in AI (Gemini Nano) for refining summaries 
 * and structured data based on user instructions.
 */
export async function chatWithAI(
    pageContent: PageContent,
    currentSummary: string,
    currentStructuredData: StructuredData,
    userMessage: string
): Promise<ChatResponse> {
    try {
        // Create a new AI session using the LanguageModel API
        const session = await createAISession();

        const promptText = getChatPrompt(
            pageContent,
            currentSummary,
            currentStructuredData,
            userMessage
        );

        // Get the AI response
        const result = await session.prompt(promptText);

        // Clean up the session
        if (session.destroy) {
            session.destroy();
        }

        try {
            const jsonResult = JSON.parse(result);
            return {
                summary: jsonResult.summary,
                structuredData: jsonResult.structuredData,
                aiResponse:
                    jsonResult.aiResponse || "好的,我已嘗試根據您的指示進行調整。",
            };
        } catch (e) {
            console.error("無法解析 AI 的對話 JSON 回應:", result, e);
            // If parsing fails, return the previous state with an error message
            return {
                summary: currentSummary,
                structuredData: currentStructuredData,
                aiResponse: "抱歉,我無法理解您的指令或解析我的回應。請再試一次。",
            };
        }
    } catch (error) {
        console.error("Error in chatWithAI:", error);
        // Return previous state with error message
        return {
            summary: currentSummary,
            structuredData: currentStructuredData,
            aiResponse: `發生錯誤: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
