import { PageContent, SummaryResponse } from '../types';
import { getSummarizationPrompt } from './prompt/summarization';
import { createAISession } from './index';

/**
 * Use Chrome Built-in AI (Gemini Nano) to summarize page content.
 * This function creates a new AI session, sends the summarization prompt,
 * and parses the structured JSON response.
 */
export async function summarizeContentWithAI(pageContent: PageContent): Promise<SummaryResponse> {
    try {
        // Create an AI session using the new LanguageModel API
        const session = await createAISession();

        const promptText = getSummarizationPrompt(pageContent);

        // Use the session to get a response
        const result = await session.prompt(promptText);

        // Clean up the session
        if (session.destroy) {
            session.destroy();
        }

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