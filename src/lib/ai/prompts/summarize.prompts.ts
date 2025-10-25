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
Extract structured data from the content following the schema below.

## CRITICAL RULES:
- You **MUST** output a JSON object matching the exact schema below
- **ALL** keys must be present in the output
- For metadata fields (content_type, publication_date, source_domain): use null if not found
- For list fields: use an empty array [] if no relevant items are found
- Do **NOT** omit any keys or add extra keys
- List fields should contain **specific, concrete items only** - avoid vague or generic entries

## Output Schema:

{
  "authors": ["List of authors or primary contributors"],
  "organizations": ["Organizations, companies, or institutions mentioned"],
  "mentioned_people": ["People mentioned in text (excluding authors)"],
  "locations": ["Geographical locations mentioned"],
  "key_events": ["Specific named events (e.g., 'Google I/O 2025', 'World War II')"],
  "external_references": ["External sources, DOIs, papers, or links cited"],
  
  "key_concepts": ["Core topics or abstract concepts (e.g., 'Machine Learning', 'Quantum Computing')"],
  "technologies_tools": ["Specific software, hardware, libraries, frameworks (e.g., 'React', 'TensorFlow', 'AWS')"],
  "methodologies": ["Algorithms, methods, or approaches (e.g., 'K-means Clustering', 'Agile Development')"],
  "code_elements": ["Function names, APIs, class names mentioned (e.g., 'cudaMalloc()', 'useState()')"],
  
  "problems_discussed": ["Specific challenges or issues addressed (e.g., 'Memory leaks in C++')"],
  "solutions_proposed": ["Specific solutions or recommendations (e.g., 'Use smart pointers')"],
  "comparisons": ["Direct A vs B comparisons (e.g., 'Python vs Java', 'SQL vs NoSQL')"],
  
  "datasets_mentioned": ["Named datasets (e.g., 'ImageNet', 'MNIST', 'CIFAR-10')"],
  "data_sources": ["Data providers or platforms (e.g., 'Kaggle', 'U.S. Census Bureau')"],
  "mentioned_media": ["Books, papers, movies, podcasts referenced (e.g., 'Clean Code', 'The Pragmatic Programmer')"]
}

## Extraction Guidelines:
- Be specific: Extract concrete items, not categories. Good: "React", "Vue.js". Bad: "frontend frameworks"
- Be selective: Only include items explicitly mentioned or clearly implied in the content
- Use exact names: Preserve proper capitalization and formatting (e.g., "TensorFlow" not "tensorflow")
- For dates: Extract from metadata, headers, or publication info; use YYYY-MM-DD format
- For domain: Extract from URL or source information
- Empty is OK: Many fields will be empty arrays for most content - this is expected and correct
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
