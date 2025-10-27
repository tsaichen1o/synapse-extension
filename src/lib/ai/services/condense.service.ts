import type { AI } from '../ai';
import type { PageContent, CondensedPageContent } from '../../types';
import { CondensePrompts } from './prompts';


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
 * METADATA HANDLING:
 * - Extractors are responsible for providing complete metadata
 * - CondenseService does NOT re-extract metadata
 * - Metadata is passed through unchanged from PageContent to CondensedPageContent
 * 
 * Key benefits:
 * - Handles content of ANY size without hitting token limits
 * - Preserves all essential information
 * - Reuses accurate metadata from extractors
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

    private onProgress?: (current: number, total: number) => void;
    setProgressCallback(callback: (current: number, total: number) => void): void {
        this.onProgress = callback;
    }

    private readonly CHUNK_SIZE = 6000;
    private readonly TARGET_CONDENSED_LENGTH = 8000;

    /**
     * Main method: Convert PageContent to CondensedPageContent using iterative AI processing
     * This method handles content of any size by processing it in chunks
     * 
     * NOW UNIFIED: All content types go through the same pipeline
     * Metadata is directly copied from PageContent without AI re-extraction
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

            // Step 1: Use metadata from extractor (no AI re-extraction)
            console.log("✓ Using metadata from extractor:", pageContent.metadata.contentType);
            const contentType = pageContent.metadata.contentType;

            // Step 2: Split content into manageable chunks
            console.log("✂️  Step 2: Splitting content into chunks...");
            const chunks = this.splitIntoChunks(rawContent, this.CHUNK_SIZE);
            console.log(`✓ Split into ${chunks.length} chunks`);

            // Step 3: Process chunks iteratively to condense
            console.log("🔄 Step 3: Processing chunks iteratively...");
            const condensedContent = await this.processChunksIteratively(
                chunks,
                contentType
            );
            console.log(`✓ Content condensed to ${condensedContent.length} chars`);

            // Step 4: Generate concise title
            console.log("✏️  Step 4: Generating concise title...");
            const totalSteps = chunks.length <= 1 ? 3 : chunks.length + 3;
            const conciseTitle = await this.generateConciseTitle(
                pageContent.title || '',
                condensedContent,
                contentType
            );
            if (this.onProgress) this.onProgress(totalSteps, totalSteps);
            console.log(`✓ Generated title: "${conciseTitle}"`);

            const compressionRatio = condensedContent.length / originalLength;

            const result: CondensedPageContent = {
                title: conciseTitle,
                url: pageContent.url || '',
                condensedContent,
                metadata: pageContent.metadata,
                originalLength,
                condensedLength: condensedContent.length,
                compressionRatio,
            };

            console.log(`✅ Condensing complete! Compression ratio: ${(compressionRatio * 100).toFixed(1)}%`);
            return result;

        } catch (error) {
            console.error("❌ Error in condensePageContent:", error);
            throw error;
        }
    }

    /**
     * Split content into chunks of approximately equal size
     */
    private splitIntoChunks(content: string, chunkSize: number): string[] {
        if (content.length <= chunkSize) {
            return [content];
        }

        const paragraphs = content
            .split(/\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
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
        contentType: string
    ): Promise<string> {
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        if (totalLength <= this.TARGET_CONDENSED_LENGTH) {
            console.log("Content is already small enough, doing single refinement pass...");
            if (this.onProgress) this.onProgress(1, 3);
            const ret = totalLength > 0 ? await this.refineContent(chunks.join('\n\n'), contentType) : '';
            if (this.onProgress) this.onProgress(2, 3);
            return ret;
        }

        // Total steps: 1 (init) + chunks.length (process chunks) + 1 (convert to text) + 1 (generate title)
        const totalSteps = chunks.length + 3;

        let condensedSummary = await this.initializeCondensedSummary(
            '', // Description not needed anymore
            contentType
        );
        if (this.onProgress) this.onProgress(1, totalSteps);

        for (let i = 0; i < chunks.length; i++) {
            console.log(`📖 Reading and integrating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

            condensedSummary = await this.updateCondensedSummary(
                condensedSummary,
                chunks[i],
                i,
                chunks.length,
                contentType
            );
            if (this.onProgress) this.onProgress(i + 2, totalSteps);

            console.log(`✓ Summary updated (current length: ${condensedSummary.length} chars)`);
        }

        const finalText = await this.convertSummaryToText(condensedSummary, contentType);
        if (this.onProgress) this.onProgress(totalSteps - 1, totalSteps);

        return finalText;
    }

    /**
     * Initialize condensed summary structure for incremental building
     */
    private async initializeCondensedSummary(
        description: string,
        contentType: string
    ): Promise<string> {
        const prompt = CondensePrompts.initializeCondensedSummary(
            description,
            contentType
        );

        try {
            const structure = await this.ai.prompt(prompt);
            return structure.trim();
        } catch (error) {
            console.warn("⚠️  Failed to initialize summary structure:", error);
            throw error;
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
        contentType: string
    ): Promise<string> {
        const prompt = CondensePrompts.updateCondensedSummary(
            currentSummary,
            newChunk,
            chunkIndex,
            totalChunks,
            contentType
        );

        try {
            const updatedSummary = await this.ai.prompt(prompt);
            return updatedSummary.trim();
        } catch (error) {
            console.warn(`⚠️  Failed to update summary for chunk ${chunkIndex + 1}, keeping previous summary`);
            throw error;
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
            console.warn("⚠️  Failed to convert to narrative, using structured form", error);
            throw error;
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
            console.warn("⚠️  Refinement failed, using original", error);
            throw error;
        }
    }

    /**
     * Generate a concise title from condensed content
     */
    private async generateConciseTitle(
        originalTitle: string,
        condensedContent: string,
        contentType: string
    ): Promise<string> {
        if (contentType === 'research-paper') return originalTitle;

        const prompt = CondensePrompts.generateConciseTitle(
            originalTitle,
            condensedContent,
        );

        try {
            const conciseTitle = await this.ai.prompt(prompt);
            return conciseTitle.trim();
        } catch (error) {
            console.warn("⚠️  Failed to generate concise title, using original", error);
            throw error;
        }
    }
}
