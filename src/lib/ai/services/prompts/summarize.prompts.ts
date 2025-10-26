import type { ContentExtraction } from '../schemas';
import type { CondensedPageContent } from '../../../types';

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
${metadata.authors && metadata.authors.length > 0 ? `Authors (MUST include in structured data): ${metadata.authors.join(', ')}` : ''}
${metadata.paperStructure ? `
## Research Paper Context:
${metadata.paperStructure.researchQuestion ? `Research Question: ${metadata.paperStructure.researchQuestion}` : ''}
${metadata.paperStructure.mainContribution ? `Main Contribution: ${metadata.paperStructure.mainContribution}` : ''}
${metadata.paperStructure.methodology ? `Methodology: ${metadata.paperStructure.methodology}` : ''}
${metadata.paperStructure.keyFindings ? `Key Findings: ${metadata.paperStructure.keyFindings}` : ''}
` : ''}
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
2. Key themes and concepts (1-5 major themes, aim for 3-5 if possible)
3. Important facts, data, or findings (list what you find, can be empty if none)
4. Target audience or intended use case

${metadata?.contentType === 'research-paper' ? `
**SPECIAL INSTRUCTIONS FOR RESEARCH PAPERS**:
- Focus on identifying the paper's core contribution and novelty
- Distinguish between background/related work vs. the paper's own contributions
- Note the experimental setup, datasets, and evaluation metrics
- Identify limitations and future work mentioned
` : ''}

Output a JSON object with:
- mainTopic: brief description of the main topic
- keyThemes: array of 1-5 key themes
- importantFacts: array of important facts (empty array if none found)
- targetAudience: description of target audience
        `.trim();
    }

    /**
     * Step 2: Identify and extract structured data based on initial analysis
     */
    static structuredData(content: string, title: string, extraction: ContentExtraction, metadata?: CondensedPageContent['metadata']): string {
        // Special handling for research papers with pre-extracted authors
        const authorHint = metadata?.authors && metadata.authors.length > 0
            ? `\n## ⚠️ CRITICAL - AUTHORS ALREADY IDENTIFIED:\n${metadata.authors.join(', ')}\n**You MUST include these authors in the "authors" field.**\n`
            : '';

        return `
# Step 2: Structured Data Extraction

## Context from Previous Analysis:
Main Topic: ${extraction.mainTopic}
Key Themes: ${extraction.keyThemes.join(', ')}
${authorHint}

## Content:
Title: ${title}
${content}

# Your Task
Extract structured data from the content following the schema below.

## CRITICAL RULES:
1. **Output valid JSON only** - exactly matching the example format below
2. **Include ALL fields** - use empty arrays [] for fields with no data
3. **Be specific and concrete** - avoid vague or generic entries
4. **For papers/articles**: ${metadata?.authors && metadata.authors.length > 0 ? '⚠️ USE THE PRE-IDENTIFIED AUTHORS ABOVE' : 'Authors are priority - check bylines, headers, document start/end'}

## Required Output Format:

Return a JSON object with exactly these fields (copy this structure):

{
  "authors": [],
  "organizations": [],
  "mentioned_people": [],
  "locations": [],
  "key_events": [],
  "external_references": [],
  "key_concepts": [],
  "technologies_tools": [],
  "methodologies": [],
  "code_elements": [],
  "problems_discussed": [],
  "solutions_proposed": [],
  "comparisons": [],
  "datasets_mentioned": [],
  "data_sources": [],
  "mentioned_media": []
}

## Field Descriptions:
- **authors**: Author names or primary contributors ${metadata?.authors && metadata.authors.length > 0 ? '(USE PRE-IDENTIFIED AUTHORS)' : ''}
- **organizations**: Companies, institutions mentioned
- **mentioned_people**: People mentioned (excluding authors)
- **locations**: Geographical locations
- **key_events**: Named events (e.g., "Google I/O 2025")
- **external_references**: External sources, DOIs, papers cited
- **key_concepts**: Core topics (e.g., "Machine Learning")
- **technologies_tools**: Software, frameworks (e.g., "React", "TensorFlow")
- **methodologies**: Algorithms, methods (e.g., "K-means Clustering")
- **code_elements**: Function names, APIs (e.g., "useState()")
- **problems_discussed**: Specific challenges addressed
- **solutions_proposed**: Specific solutions or recommendations
- **comparisons**: A vs B comparisons (e.g., "Python vs Java")
- **datasets_mentioned**: Named datasets (e.g., "ImageNet")
- **data_sources**: Data providers (e.g., "Kaggle")
- **mentioned_media**: Books, papers, podcasts referenced

## Extraction Guidelines:
- **Include ALL 16 fields** in your response (use [] for empty)
- ${metadata?.authors && metadata.authors.length > 0 ? '**USE PRE-IDENTIFIED AUTHORS** from the metadata above' : '**Prioritize authors** for papers/articles'}
- **Be specific**: "React" ✓ | "frontend frameworks" ✗
- **Only include items explicitly mentioned** in the content
- **Use exact names**: Preserve capitalization
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
