import { SummaryResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { normalizeStructuredData } from './utils';
import { SummarizePrompts } from './prompts';
import { getTemplate, generateSchemaFromTemplate, ContentTemplate } from './templates';
import { AIErrors } from '../../errors';

/**
 * Summarization service that uses an AI instance with 2-step processing
 * Accepts condensed page content for efficient AI processing
 * 
 * Approach:
 * Step 1: Extract themes + structured data (single AI call)
 * Step 2: Generate summary (single AI call)
 */
export class SummarizeService {
    private onProgress?: (current: number, total: number) => void;

    constructor(private ai: AI) { }

    /**
     * Set progress callback for real-time progress updates
     */
    setProgressCallback(callback: (current: number, total: number) => void): void {
        this.onProgress = callback;
    }

    /**
     * Summarize condensed page content using 2-step processing
     * 
     * @param input - Condensed page content with metadata
     * @returns Summary and structured data
     */
    async summarize(input: CondensedPageContent): Promise<SummaryResponse> {
        try {
            const totalSteps = 2;
            const content = input.condensedContent;
            const title = input.title;
            const metadata = input.metadata;
            const contentType = metadata.contentType;
            const template = getTemplate(contentType);

            const structuredData = await this.extractStructuredData(
                content,
                title,
                template,
                metadata
            );
            if (this.onProgress) this.onProgress(1, totalSteps);

            let summary = await this.generateSummary(content, structuredData, template, metadata);
            summary = summary.trim();
            if (this.onProgress) this.onProgress(2, totalSteps);

            return {
                summary: summary,
                structuredData: normalizeStructuredData(structuredData),
            };
        } catch (error) {
            console.error("❌ Error in 2-step summarize:", error);
            throw error;
        }
    }

    /**
     * Extract structured data from content
     */
    private async extractStructuredData(
        content: string,
        title: string,
        template: ContentTemplate,
        metadata?: CondensedPageContent['metadata']
    ): Promise<Record<string, unknown>> {
        try {
            const schema = generateSchemaFromTemplate(template);
            const prompt = SummarizePrompts.structuredDataExtraction(content, title, template, metadata);
            console.log("🧾 Structured Data Extraction Prompt:", prompt);
            console.log("🧾 Extraction Schema:", JSON.stringify(schema, null, 2));
            console.log("🧾 Extraction Schema:", schema);
            console.log("Length:", prompt.length);
            const result = await this.ai.promptStructured<Record<string, unknown>>(prompt, schema);

            return result;
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.extractionFailed('summarize', aiError);
        }
    }

    /**
     * Generate summary based on content and structured data
     */
    private async generateSummary(
        content: string,
        structuredData: Record<string, unknown>,
        template: ContentTemplate,
        metadata: CondensedPageContent['metadata']
    ): Promise<string> {
        try {
            const prompt = SummarizePrompts.summaryWithTemplate(content, structuredData, template, metadata);
            const summary = await this.ai.prompt(prompt);
            return summary;
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.summaryFailed(aiError);
        }
    }
}
