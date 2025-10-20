import { PageContent, StructuredData, ChatResponse } from '../types';
import { getChatPrompt } from './prompt/chat';
import { AI } from './ai';

/**
 * Interactive chat with Chrome Built-in AI (Gemini Nano) for refining summaries 
 * and structured data based on user instructions.
 * 
 * @param pageContent - The original page content
 * @param currentSummary - Current summary text
 * @param currentStructuredData - Current structured data
 * @param userMessage - User's chat message
 * @param aiInstance - Optional existing AI instance to reuse. If not provided, a new instance will be created and destroyed.
 */
export async function chatWithAI(
    pageContent: PageContent,
    currentSummary: string,
    currentStructuredData: StructuredData,
    userMessage: string,
    aiInstance?: AI
): Promise<ChatResponse> {
    const shouldCleanup = !aiInstance;

    try {
        // Use provided instance or create a new one
        const ai = aiInstance || await AI.create({
            temperature: 0.8,
            topK: 50,
            systemPrompt: 'You are a helpful assistant that refines content summaries and structured data based on user feedback.'
        });

        const result = await ai.chat(
            pageContent,
            currentSummary,
            currentStructuredData,
            userMessage
        );

        // Clean up only if we created the instance ourselves
        if (shouldCleanup) {
            ai.destroy();
        }

        return result;
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
