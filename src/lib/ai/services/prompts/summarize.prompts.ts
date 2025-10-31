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
    const metadataSummary = buildMetadataSummary(metadata);
    const parserCandidates = formatParserCandidates(metadata?.extra);
    const fieldsSection = generateFieldsPromptSection(template);

    const parts: string[] = [
      '# Structured Data Extraction',
      '',
      '## Page Information:',
      `Title: ${pageTitle}`,
      `Content Type: ${template.name}`,
    ];

    if (metadataSummary) {
      parts.push(metadataSummary);
    }

    if (parserCandidates) {
      parts.push('');
      parts.push('## Candidate Attributes from Parser:');
      parts.push('These machine-extracted attributes often contain valuable structured details. Treat them as high-priority leads, preserve precise specifications (dimensions, capacities, model numbers, etc.), and verify them against the content.');
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
    parts.push('Extract structured data that best represents the content according to the template below. Prioritize keyword-style keys and concise values so that two entities can be compared or linked directly.');
    parts.push('');
    parts.push(fieldsSection);
    parts.push('');

    if (metadata?.authors && metadata.authors.length > 0) {
      parts.push(`⚠️ **CRITICAL**: The authors are already identified as: ${metadata.authors.join(', ')}. You MUST include them in the "authors" field.`);
      parts.push('');
    }

    parts.push('**IMPORTANT**:');
    parts.push('- Include ALL template fields (use [] or "" for empty fields)');
    parts.push('- Be specific and concrete - avoid vague entries');
    parts.push('- Express values as concise keywords or short noun phrases (avoid long sentences)');
    parts.push('- Prefer discrete spec-style values (numbers, units, model identifiers) over descriptive marketing phrasing');
    parts.push('- Treat every array item as a single fact. Split combined lists like "16GB, 369g" into separate entries.');
    parts.push('- When capturing measurements or specifications, label them using the property name (e.g., "Weight: 369 g"). Infer the label from nearby wording when it is obvious.');
    parts.push('- Never return comma-separated bundles of unlabeled values; always create distinct, labeled items or move them into separate fields.');
    parts.push('- Extract exact names and preserve capitalization');
    parts.push('- Only include information explicitly mentioned in the content');

    if (parserCandidates) {
      parts.push('- Start with the parser candidate attributes above and validate each against the content before using them.');
      parts.push('- Map parser keys to the closest template fields whenever possible; when no template field fits, add a new keyword-style key (lowercase snake_case) with the parser value.');
      parts.push('- Keep parser-supplied specifications (e.g., size, weight, sku, voltage) verbatim unless the content explicitly contradicts them.');
      parts.push('- Favor parser terminology for consistency across documents and ignore fuzzy marketing descriptors when a precise spec is available.');
      parts.push('- Avoid duplicates—merge compatible parser values with existing fields rather than creating redundant entries.');
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

    return `
# Summary Generation

## Pre-extracted Metadata:
${metadataSection}

## Structured Data Extracted:
${JSON.stringify(structuredData, null, 2)}

## Content:
${content}

# Your Task
Write a concise, informative summary (around 150-250 words unless the template specifies otherwise) that suits this ${template.name.toLowerCase()}.

## Guidelines for ${template.name}:
${template.summaryGuidelines}

## Writing Style:
- Clear and audience-appropriate tone
- Flows naturally with good transitions
- Captures the essence without unnecessary details
- Uses accessible language
- Highlights the most important information surfaced in the structured data and content

Return ONLY the summary text (no JSON, no markdown headers, just the summary paragraph).
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
