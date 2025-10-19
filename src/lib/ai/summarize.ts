import { PageContent, SummaryResponse } from '../types';
import { getSummarizationPrompt } from './prompt/summarization';
import { AI } from './ai';

/**
 * Use Chrome Built-in AI (Gemini Nano) to summarize page content.
 * This function creates a new GeminiAI instance, sends the summarization prompt,
 * and parses the structured JSON response.
 */
export async function summarizeContentWithAI(pageContent: PageContent): Promise<SummaryResponse> {
    try {
        // Create a GeminiAI instance with optimized settings for summarization
        const ai = await AI.create({
            temperature: 0.7,
            topK: 40,
            systemPrompt: 'You are a professional content summarizer. Extract key information and create concise summaries.'
        });

        const promptText = getSummarizationPrompt(pageContent);

        // Use the AI instance to get a response
        const result = await ai.prompt(promptText);

        // Clean up the AI instance
        ai.destroy();

        try {
            const jsonResult: SummaryResponse = JSON.parse(result);
            return {
                summary: jsonResult.summary,
                structuredData: jsonResult.structuredData,
            };
        } catch (e) {
            console.error("Unable to parse JSON response from AI:", result, e);
            // Return the raw response as summary if JSON parsing fails
            return {
                summary: result,
                structuredData: {},
            };
        }
    } catch (error) {
        console.error("Error in summarizeContentWithAI:", error);
        throw new Error(`Failed to summarize content: ${error instanceof Error ? error.message : String(error)}`);
    }
}