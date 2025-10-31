/**
 * Prompt templates for CondenseService
 */
export class CondensePrompts {
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
        const isFirstChunk = chunkIndex === 0 || !currentSummary.trim();

        return `
${isFirstChunk ?
                `You are starting to build a condensed summary by reading content in chunks.
This is chunk 1 of ${totalChunks}.` :
                `You are building a condensed summary by reading content in chunks.
Progress: Reading chunk ${chunkIndex + 1} of ${totalChunks}.`}

${isFirstChunk ? '## Content to Summarize:' : `## Current Summary:
${currentSummary}

## New Content Just Read:`}
${newChunk}

# Your Task
${isFirstChunk ?
                `Create an initial condensed summary of this content:` :
                `Update the summary by integrating the new content:`}

${contentType === 'research-paper' || contentType === 'research-abstract' ? `
**FOR RESEARCH PAPERS${contentType === 'research-abstract' ? ' (ABSTRACT ONLY)' : ''}**:
${contentType === 'research-abstract' ?
                    `**This is just an abstract page - keep it simple:**
1. Summarize the main research problem or question
2. Describe the proposed solution or approach (if mentioned)
3. Note the main contribution or key finding (if mentioned)
4. Write 2-3 clear sentences in plain language
5. Do NOT invent details that aren't in the abstract

**Output**: A brief, clear paragraph (100-200 words maximum)` :
                    `1. **Identify the section** this chunk belongs to (Introduction/Background/Methods/Results/Discussion/Conclusion)
2. **${isFirstChunk ? 'Extract' : 'Integrate'} relevant information**:
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
5. **${isFirstChunk ? 'Be comprehensive' : 'Avoid duplication'}**: ${isFirstChunk ? 'Capture all important information from this first chunk' : 'If information is already covered, don\'t repeat it'}
6. **${isFirstChunk ? 'Prepare for updates' : 'Refine as needed'}**: ${isFirstChunk ? 'Structure the summary so it can be extended with future chunks' : 'Update earlier parts if new content provides clarification'}

**CRITICAL**: 
- Keep technical terms exact
- Preserve all numbers and proper nouns
- Output as NARRATIVE TEXT (paragraphs), not structured/JSON format`}
` : `
**FOR GENERAL CONTENT**:
1. Identify the main points in this ${isFirstChunk ? 'content' : 'new chunk'}
2. ${isFirstChunk ? 'Create a comprehensive summary' : 'Integrate new information into the narrative'}
3. ${isFirstChunk ? 'Focus on the most important information' : 'Refine existing content if this chunk provides clarification'}
4. ${isFirstChunk ? 'Capture key details and context' : 'Avoid redundancy - don\'t repeat what\'s already captured'}
5. Write as flowing narrative text with clear transitions
6. Keep the summary concise but complete
`}

**Output Format**: 
Return ${contentType === 'research-abstract' ? 'a brief paragraph (2-3 sentences)' : `the ${isFirstChunk ? 'initial' : 'COMPLETE updated'} summary as flowing narrative text (paragraphs)`}.
${contentType === 'research-abstract' ? 'Keep it simple and clear.' : 'NOT as JSON, NOT as bullet points - write as a coherent article/essay.'}

**Length Target**: 
${contentType === 'research-abstract' ?
                'Maximum 200 words. Be concise and direct.' :
                `Keep total length under ${contentType === 'research-paper' ? '1200' : '800'} words.
${isFirstChunk ? 'Start with a solid foundation that can be built upon.' : 'If you need space, compress earlier sections slightly, but NEVER lose critical information.'}`}
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
