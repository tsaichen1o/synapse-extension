import type { PageContent } from '../../types';

/**
 * Prompt templates for CondenseService
 */
export class CondensePrompts {
    /**
     * Extract metadata and identify content type
     */
    static metadata(pageContent: PageContent): string {
        return `
Analyze this web page and extract key metadata:

Title: ${pageContent.title}
URL: ${pageContent.url}
Description: ${pageContent.metaDescription || 'None'}
Headings: ${pageContent.headings?.slice(0, 10).join(', ') || 'None'}

First 1000 characters of content:
${(pageContent.content || pageContent.abstract || pageContent.fullText || '').substring(0, 1000)}

Output a JSON object with:
- description: brief description (1-2 sentences)
- mainTopics: array of 1-5 main topics
- keyEntities: array of 1-5 key entities (people, places, organizations, etc.)
- contentType: one of "article", "documentation", "research-paper", "blog", "news", "tutorial", "other"
        `.trim();
    }

    /**
     * Condense a single chunk with context from previous chunks
     */
    static chunk(
        chunk: string,
        contentType: string,
        previousContext: string,
        chunkIndex: number,
        totalChunks: number
    ): string {
        const contextInfo = previousContext
            ? `\n\nPrevious content context:\n${previousContext}`
            : '';

        return `
You are condensing part ${chunkIndex + 1} of ${totalChunks} from a ${contentType}.
${contextInfo}

Current section to condense:
${chunk}

Instructions:
- Preserve all key facts, data, and important information
- Remove redundant explanations and filler words
- Keep technical terms and specific details
- Maintain logical flow
- Aim to reduce length by 30-50% while keeping all essential information

Return ONLY the condensed text, no explanations or metadata.
        `.trim();
    }

    /**
     * Final condensing pass to ensure content fits target length
     */
    static finalCondense(content: string, contentType: string, targetLength: number): string {
        return `
Condense this ${contentType} content to approximately ${targetLength} characters.

Current content (${content.length} chars):
${content}

Instructions:
- Preserve all critical information and key facts
- Remove any remaining redundancy
- Keep the most important details and findings
- Maintain coherent structure
- Be concise but complete

Return ONLY the condensed text.
        `.trim();
    }

    /**
     * Refine content that's already within target length
     */
    static refine(content: string, contentType: string): string {
        return `
Refine and improve this ${contentType} content for clarity and conciseness.

Content:
${content}

Instructions:
- Keep all important information
- Improve clarity and flow
- Remove unnecessary words
- Maintain professional tone

Return ONLY the refined text.
        `.trim();
    }
}
