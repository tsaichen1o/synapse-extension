/**
 * Prompt templates for CondenseService
 */
export class CondensePrompts {
    /**
     * Initialize condensed summary structure for incremental building
     */
    static initializeCondensedSummary(
        title: string,
        contentType: string
    ): string {
        return `
Initialize a condensed summary structure for a ${contentType}.

Title: ${title}

Create an initial empty structure that will be incrementally filled as we read through the content.

${contentType === 'research-paper' ? `
For research papers, create a structure with these sections:
- background: Research background and motivation (initially empty)
- problem: Problem statement and research gap (initially empty)
- contribution: Main contributions (initially empty)
- methodology: Methods and approach (initially empty)
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
        contentType: string
    ): string {
        return `
You are updating a condensed summary after reading part ${chunkIndex + 1} of ${totalChunks}.

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

    /**
     * Generate a concise title from condensed content
     */
    static generateConciseTitle(
        originalTitle: string,
        condensedContent: string,
    ): string {
        return `
Generate a concise, informative title for this content.

Original Title: ${originalTitle}

Condensed Content Summary:
${condensedContent}

# Your Task
Create a SHORT, clear title (maximum 10 words) that:
1. Summarizes the main topic or focus
2. Uses clear, straightforward language
3. Is specific and informative
4. Attracts reader interest

**IMPORTANT**:
- Maximum 10 words (strict limit)
- No subtitle or colon unless absolutely necessary
- Professional and clear
- Must accurately reflect the content

Return ONLY the title text, nothing else.
        `.trim();
    }
}
