import type { CondensedPageContent } from '../../../types';
import type { ContentTemplate } from '../templates';
import { generateFieldsPromptSection } from '../templates';
import { stringifyStructuredValue } from '../utils';

const MAX_PARSER_VALUE_LENGTH = 300;

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
    const pageTitle = title && title.trim().length > 0 ? title : 'Untitled';
    const isResearchAbstract = metadata?.contentType === 'research-abstract';
    const parserCandidates = formatParserCandidates(metadata?.extra);
    const fieldsSection = generateFieldsPromptSection(template);

    const parts: string[] = [
      '# Structured Data Extraction',
      '',
      '## Page Information:',
      `Title: ${pageTitle}`,
      `Content Type: ${template.name}`,
    ];

    // Add minimal metadata (avoid duplication with content)
    if (metadata?.publishDate) {
      parts.push(`Published: ${metadata.publishDate}`);
    }

    // Only show parser candidates if they exist and aren't redundant
    if (parserCandidates && !isResearchAbstract) {
      parts.push('');
      parts.push('## Additional Metadata:');
      parts.push(parserCandidates.formatted);
      if (parserCandidates.truncatedNote) {
        parts.push(parserCandidates.truncatedNote);
      }
    }

    parts.push('');
    parts.push('## Content:');
    parts.push(content);
    parts.push('');
    parts.push('# Your Task');

    // Simplified instructions for research-abstract
    if (isResearchAbstract) {
      parts.push('Extract basic information from this research abstract. Since this is only an abstract page, information is limited.');
      parts.push('Only extract what is clearly stated. Leave fields empty if information is not available.');
    } else {
      parts.push('Extract structured data that best represents the content according to the template below.');
    }

    parts.push('');
    parts.push(fieldsSection);
    parts.push('');

    // Critical author warning only if not already in content
    if (metadata?.authors && metadata.authors.length > 0 && !content.includes(metadata.authors[0])) {
      parts.push(`⚠️ Authors: ${metadata.authors.join(', ')}`);
      parts.push('');
    }

    parts.push('**IMPORTANT**:');

    if (isResearchAbstract) {
      parts.push('- This is ONLY an abstract page - extract only what is explicitly mentioned');
      parts.push('- Use empty arrays [] or empty strings "" for missing information');
      parts.push('- Keep it simple - do not infer or guess');
    } else {
      parts.push('- Include ALL template fields (use [] or "" for empty fields)');
      parts.push('- Be specific and concrete - use concise keywords or short phrases');
      parts.push('- Extract exact names and preserve capitalization');
      parts.push('- Only include information explicitly mentioned in the content');
    }

    if (parserCandidates && !isResearchAbstract) {
      parts.push('- Validate parser metadata against content; map to template fields where possible');
      parts.push('- Avoid duplicates—merge compatible values rather than creating redundant entries');
    }

    return parts.join('\n').trim();
  }

  /**
   * Generate summary using template guidelines (without themes)
   */
  static summaryWithTemplate(
    content: string,
    structuredData: Record<string, unknown>,
    template: ContentTemplate,
    metadata: CondensedPageContent['metadata']
  ): string {
    const metadataSummary = buildMetadataSummary(metadata);
    const metadataSection = `${metadataSummary ? `${metadataSummary}\n` : ''}Content Type: ${metadata.contentType}`;
    const isAbstract = metadata.contentType === 'research-abstract';

    return `
# Summary Generation

## Pre-extracted Metadata:
${metadataSection}

## Structured Data Extracted:
${JSON.stringify(structuredData, null, 2)}

## Content:
${content}

# Your Task
${isAbstract ?
        'Write a concise summary with explicitly labeled key information from this research abstract.' :
        `Write a structured, keyword-explicit summary (around 150-250 words unless the template specifies otherwise) that suits this ${template.name.toLowerCase()}.`
      }

## Guidelines for ${template.name}:
${template.summaryGuidelines}

${isAbstract ? `
**Structured Summary Format**:
Start with a 1-2 sentence overview, then list key information explicitly:

Example format:
"[Brief 1-2 sentence overview of the research]

**Domain**: [research field]
**Problem**: [what problem addressed]  
**Approach**: [main method/technique]
**Key Techniques**: [specific methods, algorithms, or architectures]
**Datasets**: [if mentioned]
**Results**: [quantitative results if mentioned]
**Innovation**: [what's novel]"

- Use **bold labels** for categories
- List concrete values: model names, metrics, datasets, techniques
- Keep labels consistent and scannable
- Include only information explicitly stated in the abstract
` : `
## Writing Style Requirements:

**Format**: Start with a brief 2-3 sentence narrative overview, then list key information with explicit labels:

**Structure**:
1. Opening paragraph (2-3 sentences): High-level context and main point
2. Explicitly labeled key information using **bold labels** followed by concrete values

**Label Format**:
- Use consistent labels like: **Model**, **Framework**, **Dataset**, **Metric**, **Result**, **Technology**, **Method**, **Author**, **Organization**, etc.
- Format: "**Label**: value" or "**Label**: value1, value2, value3"
- Group related items under appropriate labels
- Be specific with labels - use technical terms from the domain

**Value Format**:
- Use exact names and terminology (preserve capitalization, version numbers)
- For lists, separate with commas or semicolons
- Include units for metrics (e.g., "95.2% accuracy", "$1B", "10ms latency")
- Keep values concise but precise

**Example** (Research Paper):
"This work introduces a novel attention mechanism for efficient image processing...

**Model**: ViT-Large  
**Architecture**: Transformer-based, self-attention  
**Task**: Image classification  
**Dataset**: ImageNet, JFT-300M (pre-training)  
**Metrics**: Top-1 accuracy, inference time  
**Results**: 88.5% top-1 accuracy, 2.3x faster than baseline  
**Key Innovation**: Sparse attention pattern, reducing complexity from O(n²) to O(n log n)  
**Framework**: PyTorch, JAX"

**Example** (Product):
"Premium wireless headphones with advanced noise cancellation...

**Brand**: Sony  
**Model**: WH-1000XM5  
**Price**: $399  
**Key Features**: Adaptive ANC, 30hr battery, LDAC codec, multipoint connection  
**Specs**: 40mm drivers, Bluetooth 5.2, USB-C charging  
**Materials**: Aluminum frame, protein leather earpads  
**Rating**: 4.7/5 stars"

**Critical Requirements**:
- Make keywords explicitly extractable with labels
- Prioritize structured information over flowing prose after the opening
- Use technical precision - exact model names, proper nouns, specific metrics
- This format enables easy parsing and knowledge graph construction
`}

Return ONLY the summary text (no JSON, no markdown headers, just the summary ${isAbstract ? 'sentences' : 'paragraph'}).
        `.trim();
  }
}

function buildMetadataSummary(metadata?: CondensedPageContent['metadata']): string {
  if (!metadata) {
    return '';
  }

  const lines: string[] = [];

  if (metadata.tags && metadata.tags.length > 0) {
    lines.push(`Tags/Topics: ${metadata.tags.join(', ')}`);
  }

  if (metadata.description) {
    lines.push(`Meta Description: ${metadata.description}`);
  }

  if (metadata.publishDate) {
    lines.push(`Published: ${metadata.publishDate}`);
  }

  if (metadata.authors && metadata.authors.length > 0) {
    lines.push(`Authors (pre-extracted): ${metadata.authors.join(', ')}`);
  }

  return lines.join('\n');
}

function formatParserCandidates(extra?: Record<string, unknown>): {
  formatted: string;
  truncatedNote: string | null;
} | null {
  if (!extra || Object.keys(extra).length === 0) {
    return null;
  }

  const validEntries = Object.entries(extra).filter(([_, value]) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>).length > 0;
    }

    return true;
  });

  if (validEntries.length === 0) {
    return null;
  }

  const lines: string[] = [];

  for (let index = 0; index < validEntries.length; index += 1) {
    const [key, rawValue] = validEntries[index];
    const valueText = stringifyStructuredValue(rawValue).trim();

    if (!valueText) {
      continue;
    }

    const normalizedValue = valueText.length > MAX_PARSER_VALUE_LENGTH
      ? `${valueText.slice(0, MAX_PARSER_VALUE_LENGTH)}...`
      : valueText;

    lines.push(`- ${key}: ${normalizedValue}`);
  }

  if (lines.length === 0) {
    return null;
  }

  const truncatedNote = validEntries.length > lines.length
    ? `Showing ${lines.length} of ${validEntries.length} parser attributes (remaining attributes omitted for brevity).`
    : null;

  return {
    formatted: lines.join('\n'),
    truncatedNote,
  };
}
