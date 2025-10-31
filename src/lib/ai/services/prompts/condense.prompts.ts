/**
 * Prompt templates for CondenseService
 */
export class CondensePrompts {
    /**
     * Initialize condensed summary for incremental building
     */
    static initializeCondensedSummary(
        title: string,
        contentType: string
    ): string {
        return `
Initialize a condensed summary for a ${contentType}.

Title: ${title}

You will be reading through content in chunks. Start with an empty summary that will be incrementally built.

${contentType === 'research-paper' ? `
For research papers, prepare to capture:
- Research background and motivation
- Problem statement and research gap
- Main contributions
- Methodology and approach
- Key findings and results
- Conclusions and future work
- Important technical details
` : `
For general content, prepare to capture:
- Main points and key information
- Supporting details and context
- Technical information if applicable
`}

Output: Return a brief placeholder like "Summary will be built incrementally as content is read." or similar.
This will be replaced as we process the actual content chunks.
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
You are building a condensed summary by reading content in chunks.
Progress: Reading part ${chunkIndex + 1} of ${totalChunks}.

## Current Summary:
${currentSummary}

## New Content Just Read:
${newChunk}

# Your Task
Update the summary by integrating the new content:

${contentType === 'research-paper' ? `
**FOR RESEARCH PAPERS**:
1. **Identify the section** this chunk belongs to (Introduction/Background/Methods/Results/Discussion/Conclusion)
2. **Integrate relevant information**:
   - Background/Introduction → Add research context, motivation, and problem statement
   - Methods → Add methodology, algorithms, and technical approaches
   - Results → Add specific findings, metrics, and comparisons (keep ALL numbers)
   - Discussion/Conclusion → Add insights, implications, and future work
3. **Preserve critical information**:
   - All numerical results, metrics, performance comparisons
   - Method names, algorithm names, architectural details
   - Dataset names, experimental setup details
   - Author names and references if mentioned
4. **Write as flowing narrative text**:
   - Use clear topic transitions
   - Maintain logical flow from background → methods → results → conclusions
   - Write in coherent paragraphs, NOT bullet points or JSON
5. **Avoid duplication**: If information is already covered, don't repeat it
6. **Refine as needed**: Update earlier parts if new content provides clarification

**CRITICAL**: 
- Keep technical terms exact
- Preserve all numbers and proper nouns
- Output as NARRATIVE TEXT (paragraphs), not structured/JSON format
` : `
**FOR GENERAL CONTENT**:
1. Identify the main points in this new chunk
2. Integrate new information into the narrative
3. Refine existing content if this chunk provides clarification
4. Avoid redundancy - don't repeat what's already captured
5. Write as flowing narrative text with clear transitions
6. Keep the summary concise but complete
`}

**Output Format**: 
Return the COMPLETE updated summary as flowing narrative text (paragraphs).
NOT as JSON, NOT as bullet points - write as a coherent article/essay.

**Length Target**: 
Keep total length under ${contentType === 'research-paper' ? '1200' : '800'} words.
If you need space, compress earlier sections slightly, but NEVER lose critical information.
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
