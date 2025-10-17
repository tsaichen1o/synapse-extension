import { PageContent, SummaryResponse } from '../types';
import { getSummarizationPrompt } from './prompt/summarization';

/**
 * Use AI session to summarize page content.
 */
export async function summarizeContentWithAI(pageContent: PageContent): Promise<SummaryResponse> {
    if (!window.ai || !window.ai.canCreateGenericSession) {
        throw new Error("Gemini Nano (window.ai) is not available.");
    }

    const session = await window.ai.createGenericSession();
    const promptText = getSummarizationPrompt(pageContent);

    const result = await session.prompt(promptText);
    try {
        const jsonResult: SummaryResponse = JSON.parse(result);
        return {
            summary: jsonResult.summary,
            structuredData: jsonResult.structuredData,
        };
    } catch (e) {
        console.error("Not able to parse JSON response:", result, e);
        return {
            summary: result,
            structuredData: {},
        };
    }
}