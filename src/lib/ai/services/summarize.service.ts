import { SummaryResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { normalizeStructuredData } from './utils';
import { extractionSchema } from './schemas';
import type { ContentExtraction } from './schemas';
import { SummarizePrompts } from './prompts';
import { getTemplate, generateSchemaFromTemplate } from './templates';
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
    constructor(private ai: AI) { }

    /**
     * Summarize condensed page content using 2-step processing
     * 
     * @param input - Condensed page content with metadata
     * @returns Summary and structured data
     */
    async summarize(input: CondensedPageContent): Promise<SummaryResponse> {
        try {
            console.log("🔄 Starting 2-step summarization process...");

            const content = input.condensedContent;
            const title = input.title;
            const metadata = input.metadata;

            // Get content type for template selection
            const contentType = metadata.contentType;
            const template = getTemplate(contentType);

            console.log(`📦 Condensed content: ${content.length} chars`);
            console.log(`📋 Template: ${template.name} (${template.fields.length} fields)`);

            // Step 1: Combined extraction - get themes AND structured data in one call
            console.log("📊 Step 1: Extracting themes and structured data (combined)...");
            const { themes, structuredData } = await this.extractCombined(
                content,
                title,
                template,
                metadata
            );
            console.log("✓ Combined extraction complete");
            console.log(`  - Themes: ${themes.keyThemes.length} identified`);
            console.log(`  - Structured data: ${Object.keys(structuredData).length} fields extracted`);

            // Step 2: Generate comprehensive summary
            console.log("✍️  Step 2: Generating polished summary...");
            let summary = await this.generateSummary(content, themes, structuredData, template);
            summary = summary.trim();
            console.log("✓ Summary generated");

            console.log("✅ 2-step summarization complete!");

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
     * Combined extraction step - gets both themes and structured data in one AI call
     */
    private async extractCombined(
        content: string,
        title: string,
        template: ReturnType<typeof getTemplate>,
        metadata?: CondensedPageContent['metadata']
    ): Promise<{
        themes: ContentExtraction;
        structuredData: Record<string, any>;
    }> {
        try {
            const schema = generateSchemaFromTemplate(template);
            const prompt = SummarizePrompts.combinedExtraction(content, title, template, metadata);

            const result = await this.ai.promptStructured<{
                themes: ContentExtraction;
                structuredData: Record<string, any>;
            }>(prompt, {
                type: 'object',
                properties: {
                    themes: extractionSchema,
                    structuredData: schema
                },
                required: ['themes', 'structuredData']
            });

            return result;
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.extractionFailed('summarize', aiError);
        }
    }

    /**
     * Generate summary based on extracted themes and structured data
     */
    private async generateSummary(
        content: string,
        themes: ContentExtraction,
        structuredData: Record<string, any>,
        template: ReturnType<typeof getTemplate>
    ): Promise<string> {
        try {
            const prompt = SummarizePrompts.summaryWithTemplate(content, themes, structuredData, template);
            const summary = await this.ai.prompt(prompt);
            return summary;
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.summaryFailed(aiError);
        }
    }
}
