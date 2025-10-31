import type { ContentType } from '../../../types';

/**
 * Prompt templates for ContentTypeClassifierService
 */
export class ContentTypeClassifierPrompts {
    /**
     * Classify content type based on title, content preview, and metadata
     */
    static classify(
        title: string,
        contentPreview: string,
        extractorHint: ContentType,
        url: string,
        metadata?: {
            description?: string;
            tags?: string[];
            authors?: string[];
        }
    ): string {
        const metadataInfo = [];
        
        if (metadata?.description) {
            metadataInfo.push(`Description: ${metadata.description}`);
        }
        if (metadata?.authors && metadata.authors.length > 0) {
            metadataInfo.push(`Authors: ${metadata.authors.join(', ')}`);
        }
        if (metadata?.tags && metadata.tags.length > 0) {
            metadataInfo.push(`Tags/Headings: ${metadata.tags.slice(0, 5).join(', ')}`);
        }

        const metadataSection = metadataInfo.length > 0 
            ? `\n## Metadata:\n${metadataInfo.join('\n')}\n` 
            : '';

        return `
# Content Type Classification

You are a content type classifier. Your job is to determine the most appropriate content type for this web page.

## Available Content Types:

1. **research-paper**: Academic research publications, scientific papers, preprints
   - Indicators: Abstract, methodology, results, citations, academic writing style
   
2. **article**: News articles, magazine articles, online journalism
   - Indicators: News-style writing, current events, journalist byline, publication date
   
3. **documentation**: Technical documentation, API docs, developer guides
   - Indicators: Code examples, API references, installation steps, technical instructions
   
4. **blog**: Personal or professional blog posts, opinion pieces
   - Indicators: Personal perspective, informal tone, author's insights, narrative style
   
5. **wiki**: Encyclopedia-style content, Wikipedia articles
   - Indicators: Factual, objective, encyclopedic structure, categories, references
   
6. **product**: Product pages, e-commerce listings
   - Indicators: Price, specifications, features, buy buttons, product reviews
   
7. **recipe**: Cooking recipes, food preparation guides
   - Indicators: Ingredients list, cooking steps, prep/cook time, servings
   
8. **tutorial**: Step-by-step guides, how-to articles, learning content
   - Indicators: Sequential steps, learning objectives, prerequisites, examples
   
9. **news**: Breaking news, news reports, press releases
   - Indicators: Timely information, inverted pyramid structure, news organization
   
10. **review**: Product/service reviews, critiques, evaluations
    - Indicators: Rating, pros/cons, recommendations, comparative analysis
    
11. **generic**: General web content that doesn't fit above categories
    - Use this as a fallback for mixed or unclear content

## Page Information:
URL: ${url}
Title: ${title}
Extractor Hint: ${extractorHint} (use as a suggestion, but verify with content)${metadataSection}
## Content Preview (first ~1000 characters):
${contentPreview}

## Your Task:
Analyze the page information and content preview to determine the SINGLE most appropriate content type from the list above.

Consider:
1. The actual content structure and purpose
2. Writing style and tone
3. Presence of domain-specific elements (e.g., abstract for papers, ingredients for recipes)
4. The URL and metadata hints (but don't rely solely on these)
5. The extractor hint is just a suggestion - verify it matches the actual content

Output ONLY the content type as a single word (e.g., "research-paper", "blog", "documentation").
No explanation needed, just the classification.
        `.trim();
    }
}
