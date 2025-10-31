import { AIErrors } from '../../errors';
import type { PageContent, ContentType } from '../../types';
import type { AI } from '../ai';
import { ContentTypeClassifierPrompts } from './prompts';

/**
 * Service for AI-powered content type classification
 * 
 * This service intelligently determines the best ContentType template
 * for a given PageContent by analyzing:
 * - Title and URL
 * - Content structure and style
 * - Metadata hints from extractors
 * - Actual content preview
 * 
 * Benefits:
 * - More accurate template selection than URL-based heuristics
 * - Works with all extractors (including generic DOM extractor)
 * - Lightweight - only processes content preview, not full text
 * - Falls back gracefully to extractor hint on error
 */
export class ContentTypeClassifierService {
    constructor(private ai: AI) { }

    /**
     * Classify content type using AI analysis
     * 
     * @param pageContent - Extracted page content
     * @returns Most appropriate ContentType for template selection
     */
    async classify(pageContent: PageContent): Promise<ContentType> {
        try {
            // Get extractor's hint as fallback
            const extractorHint = pageContent.metadata.contentType;

            // Prepare content preview (limit to ~1000 chars to save tokens)
            const contentPreview = this.prepareContentPreview(pageContent);

            // Build classification prompt
            const prompt = ContentTypeClassifierPrompts.classify(
                pageContent.title,
                contentPreview,
                extractorHint,
                pageContent.url,
                {
                    description: pageContent.metadata.description,
                    tags: pageContent.metadata.tags,
                    authors: pageContent.metadata.authors
                }
            );

            // Get AI classification
            const rawResponse = await this.ai.prompt(prompt);
            const classification = this.parseClassification(rawResponse.trim());

            // Validate classification
            if (this.isValidContentType(classification)) {
                console.log(`🎯 AI classified content as: ${classification} (was: ${extractorHint})`);
                return classification;
            } else {
                console.warn(`⚠️ Invalid classification '${classification}', falling back to: ${extractorHint}`);
                return extractorHint;
            }

        } catch (error) {
            // On any error, fall back to extractor hint
            const aiError = error instanceof Error ? error : new Error(String(error));
            console.warn(`⚠️ Content type classification failed, using extractor hint:`, aiError.message);
            return pageContent.metadata.contentType;
        }
    }

    /**
     * Prepare a content preview for classification
     * Limits to ~1000 chars to save tokens while keeping enough context
     */
    private prepareContentPreview(pageContent: PageContent): string {
        const MAX_PREVIEW_LENGTH = 1000;

        // Prefer metadata description if available (usually concise summary)
        const description = pageContent.metadata.description;
        if (description && description.length > 50) {
            return description.slice(0, MAX_PREVIEW_LENGTH);
        }

        // Use fullText
        const content = pageContent.fullText || '';
        return content.slice(0, MAX_PREVIEW_LENGTH);
    }

    /**
     * Parse AI response to extract content type
     * Handles various response formats
     */
    private parseClassification(response: string): ContentType {
        // Remove quotes, whitespace, and common prefixes
        let cleaned = response
            .toLowerCase()
            .replace(/^["']|["']$/g, '') // Remove quotes
            .replace(/^(the |a |an )?content type is:?\s*/i, '') // Remove common prefixes
            .replace(/^classification:?\s*/i, '')
            .trim();

        // Handle multi-line responses - take first line
        cleaned = cleaned.split('\n')[0].trim();

        return cleaned as ContentType;
    }

    /**
     * Validate that the classification is a known ContentType
     */
    private isValidContentType(type: string): type is ContentType {
        const validTypes: ContentType[] = [
            'research-paper',
            'article',
            'documentation',
            'blog',
            'wiki',
            'product',
            'recipe',
            'tutorial',
            'news',
            'review',
            'generic'
        ];

        return validTypes.includes(type as ContentType);
    }
}
