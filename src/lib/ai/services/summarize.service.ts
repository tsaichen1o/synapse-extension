import { PageContent, SummaryResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { parseAIJSON } from './utils';

/**
 * Summarization service that uses an AI instance with multi-step iterative refinement
 * Can work with either raw PageContent or pre-condensed CondensedPageContent
 */
export class SummarizeService {
    constructor(private ai: AI) { }

    /**
     * Step 1: Extract key points and main themes from the content
     */
    private buildExtractionPrompt(content: string, title: string, metadata?: CondensedPageContent['metadata']): string {
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

Return your analysis in JSON format:
{
  "mainTopic": "Brief description of the main topic",
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "importantFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "targetAudience": "Description of target audience"
}
        `.trim();
    }

    /**
     * Step 2: Identify and extract structured data based on initial analysis
     */
    private buildStructuredDataPrompt(content: string, title: string, extraction: any): string {
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

Return a JSON object with relevant key-value pairs:
{
  "Key1": "Value1 or [array of values]",
  "Key2": "Value2",
  "KeyN": "ValueN"
}
        `.trim();
    }

    /**
     * Step 3: Generate a polished summary incorporating all previous analysis
     */
    private buildSummaryPrompt(content: string, extraction: any, structuredData: any): string {
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
     * Step 4: Quality check and refinement
     */
    private buildRefinementPrompt(summary: string, structuredData: any, extraction: any): string {
        return `
# Step 4: Quality Check and Refinement

## Current Summary:
${summary}

## Current Structured Data:
${JSON.stringify(structuredData, null, 2)}

## Original Key Themes:
${extraction.keyThemes.join(', ')}

# Your Task
Review the summary and structured data for:
1. Accuracy - Does the summary reflect the key themes?
2. Completeness - Are all important aspects covered?
3. Clarity - Is the language clear and professional?
4. Structured data quality - Are the key-value pairs meaningful and well-organized?

Provide refined versions. Return in JSON format:
{
  "summary": "Refined summary (if improvements needed, otherwise keep original)",
  "structuredData": { "refined structured data" },
  "improvementsMade": "Brief description of what was improved, or 'No improvements needed'"
}
        `.trim();
    }

    /**
     * Summarize page content using multi-step iterative refinement
     * Works with either PageContent or CondensedPageContent
     */
    async summarize(input: PageContent | CondensedPageContent): Promise<SummaryResponse> {
        try {
            console.log("🔄 Starting multi-step summarization process...");

            // Determine if input is condensed or raw
            const isCondensed = 'condensedContent' in input;
            const content = isCondensed
                ? input.condensedContent
                : (input.content || input.abstract || input.fullText);
            const title = input.title;
            const metadata = isCondensed ? input.metadata : undefined;

            console.log(`📦 Input type: ${isCondensed ? 'Condensed' : 'Raw'} (${content.length} chars)`);

            // Step 1: Extract key information and themes
            console.log("📊 Step 1: Extracting key themes and concepts...");
            const extractionPrompt = this.buildExtractionPrompt(content, title, metadata);
            const extractionResult = await this.ai.prompt(extractionPrompt);
            const extraction = parseAIJSON(extractionResult);
            console.log("✓ Extraction complete:", extraction);

            // Step 2: Extract structured data based on content type
            console.log("🏗️  Step 2: Extracting structured data...");
            const structuredDataPrompt = this.buildStructuredDataPrompt(content, title, extraction);
            const structuredDataResult = await this.ai.prompt(structuredDataPrompt);
            let structuredData = parseAIJSON(structuredDataResult);
            console.log("✓ Structured data extracted:", structuredData);

            // Step 3: Generate comprehensive summary
            console.log("✍️  Step 3: Generating polished summary...");
            const summaryPrompt = this.buildSummaryPrompt(content, extraction, structuredData);
            let summary = await this.ai.prompt(summaryPrompt);
            summary = summary.trim();
            console.log("✓ Summary generated");

            // Step 4: Quality check and refinement
            console.log("🔍 Step 4: Quality check and refinement...");
            const refinementPrompt = this.buildRefinementPrompt(summary, structuredData, extraction);
            const refinementResult = await this.ai.prompt(refinementPrompt);
            const refinement = parseAIJSON(refinementResult);
            console.log("✓ Refinement complete:", refinement.improvementsMade);

            // Use refined versions if improvements were made
            const finalSummary = refinement.summary || summary;
            const finalStructuredData = refinement.structuredData || structuredData;

            console.log("✅ Multi-step summarization complete!");

            return {
                summary: finalSummary,
                structuredData: finalStructuredData,
            };

        } catch (error) {
            console.error("❌ Error in multi-step summarize:", error);
            // Fallback to simple summarization if multi-step fails
            console.warn("⚠️  Falling back to single-step summarization...");
            return this.fallbackSummarize(input);
        }
    }

    /**
     * Fallback to simple single-step summarization if multi-step fails
     */
    private async fallbackSummarize(input: PageContent | CondensedPageContent): Promise<SummaryResponse> {
        try {
            const isCondensed = 'condensedContent' in input;
            const content = isCondensed
                ? input.condensedContent
                : (input.content || input.abstract || input.fullText);
            const title = input.title;

            const promptText = `
Analyze this content and provide a summary (150-300 words) and key structured information.

Title: ${title}
Content: ${content}

Return in JSON format:
{
  "summary": "Your summary here",
  "structuredData": { "Key1": "Value1", "Key2": "Value2" }
}
            `.trim();

            const result = await this.ai.prompt(promptText);
            const jsonResult: SummaryResponse = parseAIJSON<SummaryResponse>(result);
            return {
                summary: jsonResult.summary,
                structuredData: jsonResult.structuredData,
            };
        } catch (error) {
            console.error("❌ Fallback summarization also failed:", error);
            throw new Error(`Failed to summarize content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
