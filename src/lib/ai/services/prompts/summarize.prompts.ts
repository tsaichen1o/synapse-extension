import type { CondensedPageContent } from '../../../types';
import type { ContentTemplate } from '../templates';
import { generateFieldsPromptSection } from '../templates';

/**
 * Prompt templates for SummarizeService
 */
export class SummarizePrompts {
  /**
   * Extract structured data from content (simplified version without themes)
   */
  static structuredDataExtraction(
    content: string,
    title: string,
    template: ContentTemplate,
    metadata?: CondensedPageContent['metadata']
  ): string {
    const metadataInfo = metadata ? `
## Pre-extracted Metadata:
Content Type: ${metadata.contentType}
${metadata.tags && metadata.tags.length > 0 ? `Tags/Topics: ${metadata.tags.join(', ')}` : ''}
${metadata.description ? `Description: ${metadata.description}` : ''}
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
# Structured Data Extraction

## Page Information:
Title: ${title}
Content Type: ${template.name}
${metadataInfo}

## Content:
${content}

# Your Task
Extract structured data from this ${template.name.toLowerCase()} content according to the template below.

${fieldsSection}

${metadata?.authors && metadata.authors.length > 0 ? `\n⚠️ **CRITICAL**: The authors are already identified as: ${metadata.authors.join(', ')}. You MUST include them in the "authors" field.\n` : ''}

**IMPORTANT**:
- Include ALL template fields (use [] or "" for empty fields)
- Be specific and concrete - avoid vague entries
- Extract exact names and preserve capitalization
- Only include information explicitly mentioned in the content
        `.trim();
  }

  /**
   * Generate summary using template guidelines (without themes)
   */
  static summaryWithTemplate(
    content: string,
    structuredData: Record<string, any>,
    template: ContentTemplate,
    metadata: CondensedPageContent['metadata']
  ): string {
    return `
# Summary Generation

## Pre-extracted Metadata:
${metadata.tags && metadata.tags.length > 0 ? `Tags/Topics: ${metadata.tags.join(', ')}` : ''}
${metadata.description ? `Description: ${metadata.description}` : ''}
Content Type: ${metadata.contentType}

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
