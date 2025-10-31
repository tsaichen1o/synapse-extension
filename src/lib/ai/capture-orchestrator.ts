import type { AI } from './ai';
import type { PageContent, CondensedPageContent, SummaryResponse } from '../types';

/**
 * Progress callbacks for different stages of the capture pipeline
 */
export interface CaptureProgressCallbacks {
    onCondenseProgress?: (current: number, total: number) => void;
    onSummarizeProgress?: (current: number, total: number) => void;
    onTranslationStart?: (language: string) => void;
    onTranslationComplete?: () => void;
    onTranslationError?: (error: Error) => void;
}

/**
 * Result of the complete capture pipeline
 */
export interface CaptureResult {
    processedPageContent: PageContent;
    condensedContent: CondensedPageContent;
    summary: string;
    structuredData: Record<string, unknown>;
}

/**
 * Orchestrates the complete AI-powered page capture pipeline
 * 
 * This service centralizes all AI operations in a clean, sequential flow:
 * 1. Language detection & translation (uses separate API, doesn't pollute main session)
 * 2. Content type classification (uses main session, but lightweight)
 * 3. Session reset (clean context for condensing pipeline)
 * 4. Set condense progress callback (AFTER reset to ensure it persists)
 * 5. Content condensing (iterative processing)
 * 6. Session reset (fresh context for summarization)
 * 7. Set summarize progress callback (AFTER reset to ensure it persists)
 * 8. Image context append (multimodal understanding)
 * 9. Summarization & structured data extraction
 * 
 * Benefits:
 * - Centralized error handling
 * - Clear pipeline stages
 * - Progress tracking with callbacks set AFTER resets for reliability
 * - Keeps App.tsx clean
 * - Minimal session resets (only 2 total, strategically placed)
 * - Proper session management between major pipeline stages
 * - Resilient to errors in summarization phase
 */
export class CaptureOrchestrator {
    constructor(private ai: AI) { }

    /**
     * Execute the complete capture pipeline
     * 
     * @param pageContent - Raw extracted page content
     * @param callbacks - Progress callbacks for UI updates
     * @returns Complete capture result with all processed data
     */
    async execute(
        pageContent: PageContent,
        callbacks?: CaptureProgressCallbacks
    ): Promise<CaptureResult> {
        let processedPageContent = pageContent;

        // Step 1: Language detection & translation (uses separate API, doesn't pollute main session)
        processedPageContent = await this.preprocessLanguage(processedPageContent, callbacks);

        // Step 2: AI-powered content type classification
        // This uses the main session but is quick and won't cause issues
        processedPageContent = await this.classifyContentType(processedPageContent);

        // Set up condense progress callback AFTER reset to ensure it persists
        if (callbacks?.onCondenseProgress) {
            this.ai.setCondenseProgressCallback(callbacks.onCondenseProgress);
        }

        // Step 3: Condense content to fit token limits
        const condensedContent = await this.ai.condense(processedPageContent);

        // Step 4: Reset session ONCE before summarization
        await this.ai.reset();

        // Set up summarize progress callback AFTER reset to ensure it persists
        if (callbacks?.onSummarizeProgress) {
            this.ai.setSummarizeProgressCallback(callbacks.onSummarizeProgress);
        }

        // Step 5: Append image context for multimodal understanding
        await this.ai.appendImageContext(processedPageContent);

        // Step 6: Generate summary and extract structured data
        const summaryResult = await this.ai.summarize(condensedContent);

        return {
            processedPageContent,
            condensedContent,
            summary: summaryResult.summary,
            structuredData: summaryResult.structuredData,
        };
    }

    /**
     * Step 1: Language detection and translation
     * Detects non-English content and translates to English if needed
     * 
     * @private
     */
    private async preprocessLanguage(
        pageContent: PageContent,
        callbacks?: CaptureProgressCallbacks
    ): Promise<PageContent> {
        try {
            const detectionSource = (pageContent.fullText || pageContent.metadata.description || '').trim();
            if (!detectionSource) {
                return pageContent;
            }

            // Detect language (limit to 8000 chars for efficiency)
            const languageResults = await this.ai.detectLanguage(detectionSource.slice(0, 8000));
            const [topResult] = languageResults;

            if (!topResult) {
                return pageContent;
            }

            const detectedCode = topResult.detectedLanguage?.toLowerCase();
            const isEnglish = detectedCode ? detectedCode === 'en' || detectedCode.startsWith('en-') : false;

            // If English or low confidence, skip translation
            if (isEnglish || topResult.confidence < 0.3) {
                return pageContent;
            }

            console.log(`🌐 Detected ${topResult.detectedLanguage} (confidence: ${topResult.confidence}). Translating...`);

            // Notify UI about translation start
            if (callbacks?.onTranslationStart) {
                callbacks.onTranslationStart(topResult.detectedLanguage);
            }

            // Translate all text fields in parallel
            const translationOptions = {
                sourceLanguage: topResult.detectedLanguage,
                targetLanguage: 'en' as const,
            };

            const translateText = async (text?: string): Promise<string | undefined> => {
                if (!text?.trim()) return text;
                return await this.ai.translateStreaming(text, translationOptions);
            };

            const [translatedFullText, translatedDescription] = await Promise.all([
                translateText(pageContent.fullText),
                translateText(pageContent.metadata.description),
            ]);

            // Notify UI about translation completion
            if (callbacks?.onTranslationComplete) {
                callbacks.onTranslationComplete();
            }

            // Return translated content with metadata
            return {
                ...pageContent,
                fullText: translatedFullText ?? pageContent.fullText,
                metadata: {
                    ...pageContent.metadata,
                    description: translatedDescription ?? pageContent.metadata.description,
                    extra: {
                        ...pageContent.metadata.extra,
                        originalLanguage: topResult.detectedLanguage,
                        languageDetectionConfidence: topResult.confidence,
                    },
                },
            };

        } catch (error) {
            console.warn('⚠️ Language preprocessing failed, using original content:', error);

            // Notify UI about translation error
            if (callbacks?.onTranslationError && error instanceof Error) {
                callbacks.onTranslationError(error);
            }

            return pageContent;
        }
    }

    /**
     * Step 2: AI-powered content type classification
     * Intelligently determines the best template for the content
     * 
     * Only applies AI classification for 'generic' content type.
     * Specialized extractors (arXiv, Amazon, etc.) know their content type best.
     * 
     * @private
     */
    private async classifyContentType(pageContent: PageContent): Promise<PageContent> {
        try {
            const extractorContentType = pageContent.metadata.contentType;

            // Trust specialized extractors - only use AI classifier for generic content
            if (extractorContentType !== 'generic') {
                console.log(`✅ Using specialized extractor's content type: ${extractorContentType}`);
                return pageContent;
            }

            // Use AI classifier only for generic content
            const classifiedContentType = await this.ai.classifyContentType(pageContent);
            console.log(`🤖 AI classified generic content as: ${classifiedContentType}`);

            return {
                ...pageContent,
                metadata: {
                    ...pageContent.metadata,
                    contentType: classifiedContentType,
                },
            };

        } catch (error) {
            console.warn('⚠️ Content type classification failed, using extractor hint:', error);
            return pageContent;
        }
    }
}
