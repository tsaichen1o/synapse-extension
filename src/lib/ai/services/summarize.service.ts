import { PageContent, SummaryResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { normalizeStructuredData } from './utils';
import {
    extractionSchema,
    structuredDataSchema,
    summaryResponseSchema
} from './schemas';
import type { ContentExtraction } from './schemas';
import { SummarizePrompts } from '../prompts';

/**
 * Summarization service that uses an AI instance with multi-step iterative refinement
 * Can work with either raw PageContent or pre-condensed CondensedPageContent
 */
export class SummarizeService {
    constructor(private ai: AI) { }

    /**
     * Summarize page content using multi-step iterative refinement
     * Works with either PageContent or CondensedPageContent
     */
    async summarize(input: PageContent | CondensedPageContent): Promise<SummaryResponse> {
        try {
            console.log("🔄 Starting multi-step summarization process...");

            // Determine if input is condensed or raw
            const isCondensed = 'condensedContent' in input;
            const content = isCondensed
                ? input.condensedContent
                : (input.content || input.abstract || input.fullText);
            const title = input.title;
            const metadata = isCondensed ? input.metadata : undefined;

            console.log(`📦 Input type: ${isCondensed ? 'Condensed' : 'Raw'} (${content.length} chars)`);

            // Step 1: Extract key information and themes
            console.log("📊 Step 1: Extracting key themes and concepts...");
            const extractionPrompt = SummarizePrompts.extraction(content, title, metadata);
            const extraction = await this.ai.promptStructured<ContentExtraction>(extractionPrompt, extractionSchema);
            console.log("✓ Extraction complete:", extraction);

            // Step 2: Extract structured data based on content type
            console.log("🏗️  Step 2: Extracting structured data...");
            const structuredDataPrompt = SummarizePrompts.structuredData(content, title, extraction);
            let structuredData = await this.ai.promptStructured<Record<string, any>>(structuredDataPrompt, structuredDataSchema);
            // Normalize structured data to prevent [object Object] display issues
            structuredData = normalizeStructuredData(structuredData);
            console.log("✓ Structured data extracted:", structuredData);

            // Step 3: Generate comprehensive summary
            console.log("✍️  Step 3: Generating polished summary...");
            const summaryPrompt = SummarizePrompts.summary(content, extraction, structuredData);
            let summary = await this.ai.prompt(summaryPrompt);
            summary = summary.trim();
            console.log("✓ Summary generated");

            console.log("✅ Multi-step summarization complete!");

            return {
                summary: summary,
                structuredData: structuredData,
            };

        } catch (error) {
            console.error("❌ Error in multi-step summarize:", error);
            // Fallback to simple summarization if multi-step fails
            console.warn("⚠️  Falling back to single-step summarization...");
            return this.fallbackSummarize(input);
        }
    }

    /**
     * Fallback to simple single-step summarization if multi-step fails
     */
    private async fallbackSummarize(input: PageContent | CondensedPageContent): Promise<SummaryResponse> {
        try {
            const isCondensed = 'condensedContent' in input;
            const content = isCondensed
                ? input.condensedContent
                : (input.content || input.abstract || input.fullText);
            const title = input.title;

            const promptText = SummarizePrompts.fallback(content, title);

            const jsonResult = await this.ai.promptStructured<SummaryResponse>(promptText, summaryResponseSchema);
            return {
                summary: jsonResult.summary,
                structuredData: normalizeStructuredData(jsonResult.structuredData),
            };
        } catch (error) {
            console.error("❌ Fallback summarization also failed:", error);
            throw new Error(`Failed to summarize content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
