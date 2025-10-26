import type { PageContent } from '../../../types';

/**
 * Prompt templates for CondenseService
 */
export class CondensePrompts {
    /**
     * Extract metadata and identify content type
     */
    static metadata(pageContent: PageContent): string {
        // Extract section titles if available
        const sectionTitles = pageContent.metadata.sections
            ?.map(s => s.title)
            .slice(0, 10)
            .join(', ') || 'None';

        return `
Analyze this web page and extract key metadata:

Title: ${pageContent.title}
URL: ${pageContent.url}
Description: ${pageContent.metadata.description || 'None'}
Section Headings: ${sectionTitles}

First 1000 characters of content:
${(pageContent.mainContent || pageContent.abstract || pageContent.fullText || '').substring(0, 1000)}

IMPORTANT: If this is a research paper, article, or blog post, try to extract author information.
Look for authors in:
- Bylines at the beginning (e.g., "By John Doe")
- Author sections or headers
- Metadata
- Signature areas at the end

**FOR RESEARCH PAPERS**: Also extract the paper's core structure:
- Main research question or problem addressed
- Key contribution or novelty claim
- Primary methodology/approach mentioned
- Main findings or results (if visible in abstract/intro)

Output a JSON object with these fields:
- description: brief description (1-2 sentences)
- mainTopics: array of 1-5 main topics (at least 1 topic required)
- keyEntities: array of 0-5 key entities like people, places, organizations (can be empty if none found)
- authors: array of author names if found (can be empty if no authors found)
- contentType: one of "article", "documentation", "research-paper", "blog", "news", "tutorial", "other"
- paperStructure: (ONLY for research-paper) object with { researchQuestion?, mainContribution?, methodology?, keyFindings? }
        `.trim();
    }

    /**
     * Initialize condensed summary structure for incremental building
     */
    static initializeCondensedSummary(
        title: string,
        contentType: string,
        paperContext?: {
            researchQuestion?: string;
            mainContribution?: string;
            methodology?: string;
        }
    ): string {
        const paperInfo = paperContext ? `
## Paper Context:
${paperContext.researchQuestion ? `Research Question: ${paperContext.researchQuestion}` : ''}
${paperContext.mainContribution ? `Main Contribution: ${paperContext.mainContribution}` : ''}
${paperContext.methodology ? `Methodology: ${paperContext.methodology}` : ''}
` : '';

        return `
Initialize a condensed summary structure for a ${contentType}.

Title: ${title}
${paperInfo}

Create an initial empty structure that will be incrementally filled as we read through the content.

${contentType === 'research-paper' ? `
For research papers, create a structure with these sections:
- background: Research background and motivation (initially empty)
- problem: Problem statement and research gap (initially empty)
- contribution: Main contributions (from paper context if available)
- methodology: Methods and approach (from paper context if available)
- results: Key findings and results (initially empty)
- conclusion: Conclusions and future work (initially empty)
- technical_details: Important technical details (initially empty)
` : `
For general content, create a structure with:
- main_points: Key points (initially empty)
- details: Supporting details (initially empty)
- technical_info: Technical information (initially empty)
`}

Output a JSON object representing this structure. Use empty strings "" for sections not yet filled.
        `.trim();
    }

    /**
     * Update condensed summary incrementally after reading each chunk
     */
    static updateCondensedSummary(
        currentSummary: string,
        newChunk: string,
        chunkIndex: number,
        totalChunks: number,
        contentType: string,
        paperContext?: {
            title: string;
            mainContribution?: string;
            researchQuestion?: string;
            methodology?: string;
        }
    ): string {
        const paperInfo = paperContext ? `
## Paper Context:
Title: ${paperContext.title}
${paperContext.researchQuestion ? `Research Question: ${paperContext.researchQuestion}` : ''}
${paperContext.mainContribution ? `Main Contribution: ${paperContext.mainContribution}` : ''}
${paperContext.methodology ? `Methodology: ${paperContext.methodology}` : ''}
` : '';

        return `
You are updating a condensed summary after reading part ${chunkIndex + 1} of ${totalChunks}.
${paperInfo}

## Current Condensed Summary:
${currentSummary}

## New Content Just Read:
${newChunk}

# Your Task
Update the condensed summary by:

${contentType === 'research-paper' ? `
**FOR RESEARCH PAPERS**:
1. **Identify what section** this chunk belongs to (Introduction/Background/Methods/Results/Discussion/Conclusion)
2. **Update relevant fields**:
   - If this is background/introduction → update "background" and "problem"
   - If this is methods → update "methodology" and "technical_details"
   - If this is results → update "results" with specific numbers and findings
   - If this is discussion/conclusion → update "conclusion"
3. **Preserve critical information**:
   - All numerical results, metrics, comparisons
   - Method names, algorithm names, architectural details
   - Dataset names, experimental setup
   - Author names if mentioned
4. **Maintain coherence**: Ensure the updated summary flows logically
5. **Don't duplicate**: If information is already in the summary, don't repeat it
6. **Refine if needed**: If new information contradicts or clarifies previous sections, update them

**CRITICAL**: Keep technical terms exact. Preserve all numbers and proper nouns.
` : `
1. Identify the main points in this new chunk
2. Add new information to the appropriate fields
3. Refine existing information if this chunk provides clarification
4. Remove redundancy - don't repeat what's already captured
5. Keep the summary concise but complete
`}

Output the UPDATED condensed summary as a JSON object with the same structure as the current summary.
The output should be a COMPLETE summary (not just the changes), ready to be used in the next iteration.

**IMPORTANT**: Keep the total length under ${contentType === 'research-paper' ? '1200' : '800'} words to avoid token buildup.
If you need to make room, compress earlier sections slightly, but NEVER lose critical information.
        `.trim();
    }

    /**
     * Convert structured summary to narrative text
     */
    static convertToNarrative(structuredSummary: string, contentType: string): string {
        return `
Convert this structured summary into a flowing, coherent narrative text.

Structured Summary:
${structuredSummary}

# Your Task
Create a well-written, narrative-style summary that:

${contentType === 'research-paper' ? `
**FOR RESEARCH PAPERS**:
1. Start with the research problem and motivation
2. Explain the main contribution and approach
3. Describe the methodology concisely but completely
4. Present key results with numbers
5. Conclude with insights and implications
6. Use clear topic transitions between sections
7. Maintain technical accuracy
` : `
1. Present information in a logical flow
2. Use clear transitions between topics
3. Keep the most important details
4. Write in clear, professional language
`}

**IMPORTANT**:
- Do NOT add information that's not in the structured summary
- Do NOT lose any critical details (numbers, names, technical terms)
- Keep it concise (aim for ${contentType === 'research-paper' ? '300-400' : '200-300'} words)
- Write as continuous text, NOT as bullet points

Return ONLY the narrative text.
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
