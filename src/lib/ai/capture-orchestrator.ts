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
 * 1. Set up progress callbacks (FIRST - ensures they persist)
 * 2. Language detection & translation (uses separate API, doesn't pollute main session)
 * 3. Content type classification (uses main session, but lightweight)
 * 4. Session reset (clean context for condensing pipeline)
 * 5. Content condensing (iterative processing)
 * 6. Session reset (fresh context for summarization)
 * 7. Image context append (multimodal understanding)
 * 8. Summarization & structured data extraction
 * 
 * Benefits:
 * - Centralized error handling
 * - Clear pipeline stages
 * - Progress tracking with persistent callbacks
 * - Keeps App.tsx clean
 * - Minimal session resets (only 2 total, strategically placed)
 * - Proper session management between major pipeline stages
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
        // Set up progress callbacks FIRST, before any operations
        if (callbacks?.onCondenseProgress) {
            this.ai.setCondenseProgressCallback(callbacks.onCondenseProgress);
        }
        if (callbacks?.onSummarizeProgress) {
            this.ai.setSummarizeProgressCallback(callbacks.onSummarizeProgress);
        }

        let processedPageContent = pageContent;

        // Step 1: Language detection & translation (uses separate API, doesn't pollute main session)
        processedPageContent = await this.preprocessLanguage(processedPageContent, callbacks);

        // Step 2: AI-powered content type classification
        // This uses the main session but is quick and won't cause issues
        processedPageContent = await this.classifyContentType(processedPageContent);

        // Step 3: Reset session ONCE before the main pipeline
        // This clears any pollution from classification and prepares for condensing
        await this.ai.reset();

        // Step 4: Condense content to fit token limits
        const condensedContent = await this.ai.condense(processedPageContent);

        // Step 5: Reset session ONCE before summarization
        // This gives summarization a clean context
        await this.ai.reset();

        // Step 6: Append image context for multimodal understanding
        await this.ai.appendImageContext(processedPageContent);

        // Step 7: Generate summary and extract structured data
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
     * @private
     */
    private async classifyContentType(pageContent: PageContent): Promise<PageContent> {
        try {
            const classifiedContentType = await this.ai.classifyContentType(pageContent);

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
