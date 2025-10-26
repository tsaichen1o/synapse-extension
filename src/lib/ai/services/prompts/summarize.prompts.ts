import type { ContentExtraction } from '../schemas';
import type { CondensedPageContent } from '../../../types';
import type { ContentTemplate } from '../templates';
import { generateFieldsPromptSection } from '../templates';

/**
 * Prompt templates for SummarizeService
 */
export class SummarizePrompts {
    /**
     * Combined extraction - get themes AND structured data in one AI call
     */
    static combinedExtraction(
        content: string,
        title: string,
        template: ContentTemplate,
        metadata?: CondensedPageContent['metadata']
    ): string {
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

        const fieldsSection = generateFieldsPromptSection(template);

        return `
# Combined Content Analysis and Extraction

## Page Information:
Title: ${title}
Content Type: ${template.name}
${metadataInfo}

## Content:
${content}

# Your Task
Analyze this ${template.name.toLowerCase()} content and extract TWO things in one response:

## Part 1: Theme Analysis
Extract:
1. Main topic and purpose
2. Key themes and concepts (3-5 major themes)
3. Important facts, data, or findings
4. Target audience or intended use case

${template.extractionHints ? `\n**Extraction Hints**: ${template.extractionHints}\n` : ''}

## Part 2: Structured Data
Extract structured data according to this template:

${fieldsSection}

${metadata?.authors && metadata.authors.length > 0 ? `\n⚠️ **CRITICAL**: The authors are already identified as: ${metadata.authors.join(', ')}. You MUST include them in the "authors" field.\n` : ''}

# Output Format
Return a JSON object with exactly this structure:

{
  "themes": {
    "mainTopic": "brief description of the main topic",
    "keyThemes": ["theme1", "theme2", "theme3"],
    "importantFacts": ["fact1", "fact2"],
    "targetAudience": "description of target audience"
  },
  "structuredData": {
    // All template fields here - use empty arrays [] for fields with no data
    // Include ALL fields defined in the template above
  }
}

**IMPORTANT**:
- Include ALL template fields in structuredData (use [] or "" for empty fields)
- Be specific and concrete - avoid vague entries
- Extract exact names and preserve capitalization
- Only include information explicitly mentioned in the content
        `.trim();
    }

    /**
     * Generate summary using template guidelines
     */
    static summaryWithTemplate(
        content: string,
        themes: ContentExtraction,
        structuredData: Record<string, any>,
        template: ContentTemplate
    ): string {
        return `
# Summary Generation

## Context from Analysis:
Main Topic: ${themes.mainTopic}
Key Themes: ${themes.keyThemes.join(', ')}
Target Audience: ${themes.targetAudience}

## Structured Data Extracted:
${JSON.stringify(structuredData, null, 2)}

## Content:
${content}

# Your Task
Write a concise, informative summary (150-300 words) for this ${template.name.toLowerCase()}.

## Guidelines for ${template.name}:
${template.summaryGuidelines}

## Writing Style:
- Clear and professional
- Flows naturally with good transitions
- Captures the essence without unnecessary details
- Uses accessible language
- Highlights the most important information

Return ONLY the summary text (no JSON, no markdown headers, just the summary paragraph).
        `.trim();
    }
}
