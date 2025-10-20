import { PageContent, SummaryResponse } from '../../types';
import type { AI } from '../ai';
import { parseAIJSON } from './utils';

/**
 * Summarization service that uses an AI instance
 */
export class SummarizeService {
    constructor(private ai: AI) { }

    /**
     * Generate a prompt for page content summarization
     */
    private buildPrompt(pageContent: PageContent): string {
        return `
# Web Page Content Analysis Task

## Page Information:
Title: ${pageContent.title}
URL: ${pageContent.url}
Description: ${pageContent.metaDescription || "None"}

## Main Content:
${pageContent.content || pageContent.abstract || pageContent.fullText}

## Heading Structure:
${pageContent.headings?.slice(0, 10).join(', ') || "None"}

# Task Requirements
Please analyze the above web page content and provide:
1. A concise summary in English (150-300 words)
2. Extracted structured key information

Return the results in the following JSON format, ensuring the summary is in the "summary" field and structured information is in the "structuredData" field:
{
  "summary": "...",
  "structuredData": {
    "Key1": "Value1",
    "Key2": ["Value2a", "Value2b"],
    "KeyN": "ValueN"
  }
}
        `.trim();
    }

    /**
     * Summarize page content using AI
     */
    async summarize(pageContent: PageContent): Promise<SummaryResponse> {
        try {
            const promptText = this.buildPrompt(pageContent);
            const result = await this.ai.prompt(promptText);

            try {
                const jsonResult: SummaryResponse = parseAIJSON<SummaryResponse>(result);
                return {
                    summary: jsonResult.summary,
                    structuredData: jsonResult.structuredData,
                };
            } catch (e) {
                console.error("Unable to parse JSON response from AI:", result, e);
                return {
                    summary: result,
                    structuredData: {},
                };
            }
        } catch (error) {
            console.error("Error in summarize:", error);
            throw new Error(`Failed to summarize content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
