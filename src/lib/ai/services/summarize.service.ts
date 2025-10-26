import { SummaryResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { normalizeStructuredData } from './utils';
import { extractionSchema } from './schemas';
import type { ContentExtraction } from './schemas';
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
            const totalSteps = 2 + 1;
            const content = input.condensedContent;
            const title = input.title;
            const metadata = input.metadata;
            const contentType = metadata.contentType;
            const template = getTemplate(contentType);
            if (this.onProgress) this.onProgress(1, totalSteps);

            const { themes, structuredData } = await this.extractCombined(
                content,
                title,
                template,
                metadata
            );
            this.appendPreExtractedMetadata(structuredData, metadata);
            if (this.onProgress) this.onProgress(2, totalSteps);

            let summary = await this.generateSummary(content, themes, structuredData, template);
            summary = summary.trim();
            if (this.onProgress) this.onProgress(3, totalSteps);

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
     * Append pre-extracted structured metadata directly to structured data
     * These are already accurate and structured - no need for AI to re-process
     */
    private appendPreExtractedMetadata(
        structuredData: Record<string, any>,
        metadata: CondensedPageContent['metadata']
    ): void {
        // For research papers, add references and academic metadata
        if (metadata.contentType === 'research-paper') {
            // Add top references (論文標題列表)
            if (metadata.topReferences && metadata.topReferences.length > 0) {
                console.log("📚 Appending pre-extracted references...");
                structuredData.key_references = metadata.topReferences.slice(0, 5).map(ref => {
                    return ref.title ||
                        ref.label ||
                        `${ref.authors?.join(', ') || 'Unknown'} (${ref.year || 'n.d.'})`;
                });
                console.log(`  ✓ Added ${structuredData.key_references.length} key references`);
            }

            // Add total reference count
            if (metadata.totalReferences) {
                structuredData.total_references = metadata.totalReferences;
                console.log(`  ✓ Total references: ${metadata.totalReferences}`);
            }
        }

        // Add other pre-extracted metadata if available
        // 未來可以擴展：figures, tables, equations, etc.
    }

    /**
     * Combined extraction step - gets both themes and structured data in one AI call
     */
    private async extractCombined(
        content: string,
        title: string,
        template: ContentTemplate,
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
        template: ContentTemplate
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
