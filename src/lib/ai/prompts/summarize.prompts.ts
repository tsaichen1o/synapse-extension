import type { ContentExtraction } from '../services/schemas';
import type { CondensedPageContent } from '../../types';

/**
 * Prompt templates for SummarizeService
 */
export class SummarizePrompts {
    /**
     * Step 1: Extract key points and main themes from the content
     */
    static extraction(content: string, title: string, metadata?: CondensedPageContent['metadata']): string {
        const metadataInfo = metadata ? `
## Pre-extracted Metadata:
Content Type: ${metadata.contentType}
Main Topics: ${metadata.mainTopics.join(', ')}
Key Entities: ${metadata.keyEntities.join(', ')}
` : '';

        return `
# Step 1: Content Extraction and Initial Analysis

## Page Information:
Title: ${title}
${metadataInfo}

## Content:
${content}

# Your Task
Analyze this content and extract:
1. Main topic and purpose
2. Key themes and concepts (3-5 major themes)
3. Important facts, data, or findings
4. Target audience or intended use case

Output a JSON object with:
- mainTopic: brief description of the main topic
- keyThemes: array of 3-5 key themes
- importantFacts: array of important facts
- targetAudience: description of target audience
        `.trim();
    }

    /**
     * Step 2: Identify and extract structured data based on initial analysis
     */
    static structuredData(content: string, title: string, extraction: ContentExtraction): string {
        return `
# Step 2: Structured Data Extraction

## Context from Previous Analysis:
Main Topic: ${extraction.mainTopic}
Key Themes: ${extraction.keyThemes.join(', ')}

## Content:
Title: ${title}
${content}

# Your Task
Based on the page type and content, extract the most relevant structured information.
Adapt your extraction to the content type (e.g., research paper, blog post, documentation, news article).

For research papers, extract: Authors, Year, Methodology, Key Findings, Citations
For blog posts, extract: Author, Date, Category, Tags, Key Takeaways
For documentation, extract: Version, Language, Framework, Key Features, Prerequisites
For news articles, extract: Date, Category, Location, People Mentioned, Key Events

Output a JSON object with relevant key-value pairs. Values can be strings, arrays, or numbers as appropriate.
Ensure at least one key-value pair is included.
        `.trim();
    }

    /**
     * Step 3: Generate a polished summary incorporating all previous analysis
     */
    static summary(content: string, extraction: ContentExtraction, structuredData: any): string {
        return `
# Step 3: Final Summary Generation

## Context from Previous Steps:
Main Topic: ${extraction.mainTopic}
Key Themes: ${extraction.keyThemes.join(', ')}

## Structured Data Extracted:
${JSON.stringify(structuredData, null, 2)}

## Content:
${content}

# Your Task
Write a concise, informative summary (150-300 words) that:
1. Clearly states the main topic and purpose
2. Highlights key themes and important findings
3. Is coherent and flows naturally
4. Uses professional yet accessible language
5. Captures the essence without unnecessary details

Return ONLY the summary text (no JSON, no markdown, just the summary paragraph).
        `.trim();
    }

    /**
     * Fallback: Simple single-step summarization
     */
    static fallback(content: string, title: string): string {
        return `
Analyze this content and provide a summary (150-300 words) and key structured information.

Title: ${title}
Content: ${content}

Output a JSON object with:
- summary: your summary here (150-300 words)
- structuredData: object with relevant key-value pairs
        `.trim();
    }
}
