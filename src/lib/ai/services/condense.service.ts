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
     */
    async condensePageContent(pageContent: PageContent): Promise<CondensedPageContent> {
        console.log("🔄 Starting iterative content condensing process...");

        const rawContent = pageContent.content || pageContent.abstract || pageContent.fullText || '';
        const originalLength = rawContent.length;

        console.log(`📏 Original content length: ${originalLength} chars`);

        try {
            // Reset AI session for fresh context
            await this.ai.reset();

            // Step 1: Identify content type and extract metadata
            console.log("🔍 Step 1: Analyzing content type and extracting metadata...");
            const metadata = await this.extractMetadata(pageContent);
            console.log("✓ Metadata extracted:", metadata);

            // Step 2: Split content into manageable chunks
            console.log("✂️  Step 2: Splitting content into chunks...");
            const chunks = this.splitIntoChunks(rawContent, this.CHUNK_SIZE);
            console.log(`✓ Split into ${chunks.length} chunks`);

            // Step 3: Process chunks iteratively to condense
            console.log("🔄 Step 3: Processing chunks iteratively...");
            const condensedContent = await this.processChunksIteratively(chunks, metadata.contentType);
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
     * Step 1: Extract metadata and identify content type
     */
    private async extractMetadata(pageContent: PageContent): Promise<CondensedPageContent['metadata']> {
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
                description: pageContent.metaDescription,
                mainTopics: [],
                keyEntities: [],
                contentType: 'article',
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
     * Process chunks iteratively, condensing each chunk and maintaining context
     */
    private async processChunksIteratively(chunks: string[], contentType: string): Promise<string> {
        if (chunks.length === 0) {
            return '';
        }

        // If content is already small enough, just do one pass of refinement
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        if (totalLength <= this.TARGET_CONDENSED_LENGTH) {
            console.log("Content is already small enough, doing single refinement pass...");
            return await this.refineContent(chunks.join('\n\n'), contentType);
        }

        const condensedChunks: string[] = [];
        let runningContext = '';

        for (let i = 0; i < chunks.length; i++) {
            console.log(`  Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

            const condensed = await this.condenseChunk(
                chunks[i],
                contentType,
                runningContext,
                i,
                chunks.length
            );

            condensedChunks.push(condensed);

            // Update running context with a brief summary of what we've processed so far
            runningContext = this.updateContext(runningContext, condensed, i);

            console.log(`  ✓ Condensed to ${condensed.length} chars`);
        }

        // Combine all condensed chunks
        let combined = condensedChunks.join('\n\n');

        // If still too long, do a final pass to condense further
        if (combined.length > this.TARGET_CONDENSED_LENGTH) {
            console.log("📝 Final condensing pass needed...");
            combined = await this.finalCondense(combined, contentType);
        }

        return combined;
    }

    /**
     * Condense a single chunk with context from previous chunks
     */
    private async condenseChunk(
        chunk: string,
        contentType: string,
        previousContext: string,
        chunkIndex: number,
        totalChunks: number
    ): Promise<string> {
        const prompt = CondensePrompts.chunk(chunk, contentType, previousContext, chunkIndex, totalChunks);

        try {
            const condensed = await this.ai.prompt(prompt);
            return condensed.trim();
        } catch (error) {
            console.warn(`⚠️  Failed to condense chunk ${chunkIndex + 1}, using original`);
            return chunk;
        }
    }

    /**
     * Update running context with latest condensed content
     */
    private updateContext(currentContext: string, newContent: string, chunkIndex: number): string {
        // Keep context concise - only maintain key points from previous chunks
        const contextSnippet = newContent.substring(0, 200);

        if (!currentContext) {
            return `Chunk ${chunkIndex + 1}: ${contextSnippet}...`;
        }

        // Keep only the last 2 chunks in context to avoid token buildup
        const contexts = currentContext.split('\n');
        if (contexts.length >= 2) {
            contexts.shift(); // Remove oldest context
        }

        contexts.push(`Chunk ${chunkIndex + 1}: ${contextSnippet}...`);
        return contexts.join('\n');
    }

    /**
     * Final condensing pass to ensure content fits target length
     */
    private async finalCondense(content: string, contentType: string): Promise<string> {
        const prompt = CondensePrompts.finalCondense(content, contentType, this.TARGET_CONDENSED_LENGTH);

        try {
            const condensed = await this.ai.prompt(prompt);
            return condensed.trim();
        } catch (error) {
            console.warn("⚠️  Final condense failed, truncating instead");
            return this.truncateContent(content, this.TARGET_CONDENSED_LENGTH);
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
                description: pageContent.metaDescription,
                mainTopics: [],
                keyEntities: [],
                contentType: 'article',
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
        // Split by double newlines (common paragraph separator)
        const paragraphs = content
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        // If no double newlines, try single newlines
        if (paragraphs.length === 1) {
            return content
                .split(/\n+/)
                .map(p => p.trim())
                .filter(p => p.length > 50); // Filter out very short lines
        }

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
