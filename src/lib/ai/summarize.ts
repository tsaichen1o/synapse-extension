import { PageContent, SummaryResponse } from '../types';
import { getSummarizationPrompt } from './prompt/summarization';
import { AI } from './ai';

/**
 * Use Chrome Built-in AI (Gemini Nano) to summarize page content.
 * 
 * @param pageContent - The page content to summarize
 * @param aiInstance - Optional existing AI instance to reuse. If not provided, a new instance will be created and destroyed.
 */
export async function summarizeContentWithAI(
    pageContent: PageContent,
    aiInstance?: AI
): Promise<SummaryResponse> {
    const shouldCleanup = !aiInstance;

    try {
        // Use provided instance or create a new one
        const ai = aiInstance || await AI.create({
            temperature: 0.7,
            topK: 40,
            systemPrompt: 'You are a professional content summarizer. Extract key information and create concise summaries.'
        });

        const result = await ai.summarize(pageContent);

        // Clean up only if we created the instance ourselves
        if (shouldCleanup) {
            ai.destroy();
        }

        return result;
    } catch (error) {
        console.error("Error in summarizeContentWithAI:", error);
        throw new Error(`Failed to summarize content: ${error instanceof Error ? error.message : String(error)}`);
    }
}