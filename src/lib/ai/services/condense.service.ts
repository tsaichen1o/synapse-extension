import type { AI } from '../ai';
import type { PageContent, CondensedPageContent } from '../../types';
import { metadataExtractionSchema } from './schemas';
import type { MetadataExtraction } from './schemas';
import { CondensePrompts } from '../prompts';


/**
 * CondenseService - Iteratively processes and condenses PageContent to avoid token limits
 * 
 * This service solves the token quota problem by:
 * 1. Splitting large content into manageable chunks
 * 2. Processing chunks iteratively with AI session
 * 3. Maintaining context across chunks
 * 4. Producing optimized CondensedPageContent structure
 * 
 * ALL CONTENT TYPES USE THE SAME PIPELINE:
 * - Uses standardized PageContent.mainContent (already formatted by extractors)
 * - No special handling for different extractors - they all output the same format
 * - Adapts processing based on contentType metadata, not extractor type
 * 
 * Key benefits:
 * - Handles content of ANY size without hitting token limits
 * - Preserves all essential information
 * - Provides structured metadata for better AI processing
 * - Reusable by SummarizeService and ChatService
 * 
 * Usage:
 * ```typescript
 * const condenseService = new CondenseService(aiInstance);
 * const condensed = await condenseService.condensePageContent(pageContent);
 * // Now use condensed.condensedContent in prompts without worrying about token limits
 * ```
 */
export class CondenseService {
    constructor(protected ai: AI) { }

    private readonly CHUNK_SIZE = 6000;
    private readonly TARGET_CONDENSED_LENGTH = 8000;

    /**
     * Main method: Convert PageContent to CondensedPageContent using iterative AI processing
     * This method handles content of any size by processing it in chunks
     * 
     * NOW UNIFIED: All content types go through the same pipeline
     */
    async condensePageContent(pageContent: PageContent): Promise<CondensedPageContent> {
        console.log("🔄 Starting iterative content condensing process...");
        console.log(`📦 Content type: ${pageContent.metadata.contentType}, Extractor: ${pageContent.extractorType}`);

        // Use standardized mainContent (already formatted by extractors)
        const rawContent = pageContent.mainContent || pageContent.abstract || pageContent.fullText || '';
        const originalLength = rawContent.length;

        console.log(`📏 Original content length: ${originalLength} chars`);

        try {
            // Reset AI session for fresh context
            await this.ai.reset();

            // Step 1: Extract or use existing metadata
            console.log("🔍 Step 1: Preparing metadata...");
            const metadata = await this.prepareMetadata(pageContent);
            console.log("✓ Metadata ready:", metadata);

            // Step 2: Split content into manageable chunks
            console.log("✂️  Step 2: Splitting content into chunks...");
            const chunks = this.splitIntoChunks(rawContent, this.CHUNK_SIZE);
            console.log(`✓ Split into ${chunks.length} chunks`);

            // Step 3: Process chunks iteratively to condense
            console.log("🔄 Step 3: Processing chunks iteratively...");
            const condensedContent = await this.processChunksIteratively(chunks, metadata.contentType, metadata);
            console.log(`✓ Content condensed to ${condensedContent.length} chars`);

            const compressionRatio = condensedContent.length / originalLength;

            const result: CondensedPageContent = {
                title: pageContent.title || 'Untitled',
                url: pageContent.url || '',
                condensedContent,
                metadata,
                originalLength,
                condensedLength: condensedContent.length,
                compressionRatio,
            };

            console.log(`✅ Condensing complete! Compression ratio: ${(compressionRatio * 100).toFixed(1)}%`);
            return result;

        } catch (error) {
            console.error("❌ Error in condensePageContent:", error);
            // Fallback: return original content with minimal processing
            return this.createFallbackCondensedContent(pageContent, rawContent);
        }
    }

    /**
     * Prepare metadata - use existing metadata from extractors or extract with AI
     */
    private async prepareMetadata(pageContent: PageContent): Promise<MetadataExtraction> {
        // If extractor already provided rich metadata, use it
        if (pageContent.metadata.authors || pageContent.metadata.paperStructure) {
            console.log("✓ Using metadata from extractor");
            return {
                description: pageContent.metadata.description || pageContent.abstract || 'No description available',
                mainTopics: pageContent.metadata.tags || [],
                keyEntities: [],
                contentType: pageContent.metadata.contentType,
                authors: pageContent.metadata.authors,
                paperStructure: pageContent.metadata.paperStructure,
            };
        }

        // Otherwise, extract metadata with AI
        console.log("⚙️  Extracting metadata with AI...");
        return await this.extractMetadata(pageContent);
    }

    /**
     * Step 1: Extract metadata and identify content type
     */
    private async extractMetadata(pageContent: PageContent): Promise<MetadataExtraction> {
        const prompt = CondensePrompts.metadata(pageContent);

        try {
            const metadata = await this.ai.promptStructured<MetadataExtraction>(
                prompt,
                metadataExtractionSchema
            );
            return metadata;
        } catch (error) {
            console.warn("⚠️  Failed to extract metadata, using defaults:", error);
            return {
                description: pageContent.metadata.description || pageContent.abstract || 'No description available',
                mainTopics: pageContent.metadata.tags || [],
                keyEntities: [],
                contentType: pageContent.metadata.contentType || 'generic',
            };
        }
    }

    /**
     * Split content into chunks of approximately equal size
     */
    private splitIntoChunks(content: string, chunkSize: number): string[] {
        if (content.length <= chunkSize) {
            return [content];
        }

        const paragraphs = this.splitIntoParagraphs(content);
        const chunks: string[] = [];
        let currentChunk = '';

        for (const para of paragraphs) {
            // If adding this paragraph would exceed chunk size and we already have content
            if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = para;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + para;
            }
        }

        // Add the last chunk
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Process chunks iteratively, building up a condensed summary incrementally
     * This method maintains a rolling summary that "walks through" the entire content
     */
    private async processChunksIteratively(
        chunks: string[],
        contentType: string,
        metadata?: MetadataExtraction
    ): Promise<string> {
        if (chunks.length === 0) {
            return '';
        }

        // If content is already small enough, just do one pass of refinement
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        if (totalLength <= this.TARGET_CONDENSED_LENGTH) {
            console.log("Content is already small enough, doing single refinement pass...");
            return await this.refineContent(chunks.join('\n\n'), contentType);
        }

        // Extract paper context for research papers
        const paperContext = contentType === 'research-paper' && metadata?.paperStructure
            ? {
                title: metadata.description || '',
                mainContribution: metadata.paperStructure.mainContribution,
                researchQuestion: metadata.paperStructure.researchQuestion,
                methodology: metadata.paperStructure.methodology
            }
            : undefined;

        console.log("🔄 Using incremental summarization strategy...");

        // Step 1: Initialize the condensed summary structure
        console.log("📋 Initializing condensed summary structure...");
        let condensedSummary = await this.initializeCondensedSummary(
            metadata?.description || '',
            contentType,
            metadata?.paperStructure
        );
        console.log("✓ Initial structure created");

        // Step 2: Incrementally update the summary as we read each chunk
        for (let i = 0; i < chunks.length; i++) {
            console.log(`📖 Reading and integrating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

            condensedSummary = await this.updateCondensedSummary(
                condensedSummary,
                chunks[i],
                i,
                chunks.length,
                contentType,
                paperContext
            );

            console.log(`✓ Summary updated (current length: ${condensedSummary.length} chars)`);
        }

        // Step 3: Convert the final structured summary back to text
        console.log("📝 Converting structured summary to narrative text...");
        const finalText = await this.convertSummaryToText(condensedSummary, contentType);
        console.log(`✓ Final condensed text: ${finalText.length} chars`);

        return finalText;
    }

    /**
     * Initialize condensed summary structure for incremental building
     */
    private async initializeCondensedSummary(
        description: string,
        contentType: string,
        paperStructure?: MetadataExtraction['paperStructure']
    ): Promise<string> {
        const paperContext = paperStructure ? {
            researchQuestion: paperStructure.researchQuestion,
            mainContribution: paperStructure.mainContribution,
            methodology: paperStructure.methodology
        } : undefined;

        const prompt = CondensePrompts.initializeCondensedSummary(
            description,
            contentType,
            paperContext
        );

        try {
            const structure = await this.ai.prompt(prompt);
            return structure.trim();
        } catch (error) {
            console.warn("⚠️  Failed to initialize summary structure:", error);
            // Return a simple empty structure
            if (contentType === 'research-paper') {
                return JSON.stringify({
                    background: "",
                    problem: "",
                    contribution: paperContext?.mainContribution || "",
                    methodology: paperContext?.methodology || "",
                    results: "",
                    conclusion: "",
                    technical_details: ""
                });
            } else {
                return JSON.stringify({
                    main_points: "",
                    details: "",
                    technical_info: ""
                });
            }
        }
    }

    /**
     * Update condensed summary incrementally after reading a chunk
     */
    private async updateCondensedSummary(
        currentSummary: string,
        newChunk: string,
        chunkIndex: number,
        totalChunks: number,
        contentType: string,
        paperContext?: {
            title: string;
            mainContribution?: string;
            researchQuestion?: string;
            methodology?: string;
        }
    ): Promise<string> {
        const prompt = CondensePrompts.updateCondensedSummary(
            currentSummary,
            newChunk,
            chunkIndex,
            totalChunks,
            contentType,
            paperContext
        );

        try {
            const updatedSummary = await this.ai.prompt(prompt);
            return updatedSummary.trim();
        } catch (error) {
            console.warn(`⚠️  Failed to update summary for chunk ${chunkIndex + 1}, keeping previous summary`);
            return currentSummary;
        }
    }

    /**
     * Convert structured summary to narrative text
     */
    private async convertSummaryToText(structuredSummary: string, contentType: string): Promise<string> {
        const prompt = CondensePrompts.convertToNarrative(structuredSummary, contentType);

        try {
            const narrative = await this.ai.prompt(prompt);
            return narrative.trim();
        } catch (error) {
            console.warn("⚠️  Failed to convert to narrative, using structured form");
            // If conversion fails, try to extract text from JSON structure
            try {
                const obj = JSON.parse(structuredSummary);
                const parts = Object.values(obj).filter(v => typeof v === 'string' && v.trim());
                return parts.join('\n\n');
            } catch {
                return structuredSummary;
            }
        }
    }

    /**
     * Refine content that's already within target length
     */
    private async refineContent(content: string, contentType: string): Promise<string> {
        const prompt = CondensePrompts.refine(content, contentType);

        try {
            const refined = await this.ai.prompt(prompt);
            return refined.trim();
        } catch (error) {
            console.warn("⚠️  Refinement failed, using original");
            return content;
        }
    }

    /**
     * Create fallback condensed content when processing fails
     */
    private createFallbackCondensedContent(
        pageContent: PageContent,
        rawContent: string
    ): CondensedPageContent {
        console.log("⚠️  Creating fallback condensed content");

        const truncated = this.truncateContent(rawContent, this.TARGET_CONDENSED_LENGTH);

        return {
            title: pageContent.title || 'Untitled',
            url: pageContent.url || '',
            condensedContent: truncated,
            metadata: {
                description: pageContent.metadata.description || pageContent.abstract || 'No description available',
                mainTopics: pageContent.metadata.tags || [],
                keyEntities: [],
                contentType: pageContent.metadata.contentType || 'generic',
            },
            originalLength: rawContent.length,
            condensedLength: truncated.length,
            compressionRatio: truncated.length / rawContent.length,
        };
    }

    /**
     * Split content into paragraphs
     */
    private splitIntoParagraphs(content: string): string[] {
        const paragraphs = content
            .split(/\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        return paragraphs;
    }

    /**
     * Truncate content to a maximum length while preserving meaningful text
     */
    private truncateContent(content: string, maxLength: number): string {
        if (content.length <= maxLength) {
            return content;
        }

        const truncated = content.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastNewline = truncated.lastIndexOf('\n');
        const cutPoint = Math.max(lastPeriod, lastNewline);

        if (cutPoint > maxLength * 0.8) {
            return truncated.substring(0, cutPoint + 1) + '\n\n[Content truncated...]';
        }

        return truncated + '\n\n[Content truncated...]';
    }
}
