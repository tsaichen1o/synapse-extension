import type { IntentAnalysis, Modification } from '../schemas';
import type { StructuredData } from '../../../types';

/**
 * Prompt templates for ChatService
 * All methods accept simple string/object parameters, not complex types
 */
export class ChatPrompts {
    /**
     * Step 1: Understand user intent and what needs to be modified
     */
    static intentAnalysis(
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): string {
        return `
# Step 1: Understand User Intent

## Current State:
Summary: ${currentSummary}...
Structured Data Keys: ${Object.keys(currentStructuredData).join(', ')}

## User Message:
"${userMessage}"

# Your Task
Analyze the user's message and determine:
1. What is the user asking for? (question, modification, addition, removal, clarification)
2. What specific parts need to change? (summary, structured data, or both)
3. What information from the original content is relevant?

Output a JSON object with:
- intentType: one of "question", "modify_summary", "modify_data", "add_info", "remove_info", "clarify"
- targetArea: one of "summary", "structuredData", "both", "none"
- specificChanges: array of specific changes needed
- needsOriginalContent: boolean indicating if original content is needed
- userExpectation: brief description of what user expects as output
        `.trim();
    }

    /**
     * Step 2: Execute modifications based on intent analysis
     */
    static modification(
        condensedContent: string,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string,
        intent: IntentAnalysis
    ): string {
        const relevantContent = intent.needsOriginalContent
            ? `\n## Condensed Content Reference:\n${condensedContent}`
            : '';

        return `
# Step 2: Execute Modifications

## Intent Analysis:
- User wants: ${intent.intentType}
- Target area: ${intent.targetArea}
- Specific changes: ${intent.specificChanges.join(', ')}
- User expectation: ${intent.userExpectation}

## Current Summary:
${currentSummary}

## Current Structured Data:
${JSON.stringify(currentStructuredData, null, 2)}
${relevantContent}

## User Request:
"${userMessage}"

# Your Task
Based on the intent analysis, make the requested changes:
- If modifying summary: Rewrite the affected parts while keeping the rest intact
- If modifying structured data: Update, add, or remove the relevant key-value pairs
- If answering a question: Prepare a helpful response
- Ensure changes are accurate and align with the original content when applicable

Output a JSON object with:
- modifiedSummary: the updated summary or unchanged if not modified
- modifiedStructuredData: object with updated structured data or unchanged if not modified
- changeDescription: brief description of what was changed
        `.trim();
    }

    /**
     * Step 3: Generate user-facing response and validate changes
     */
    static responseGeneration(
        userMessage: string,
        intent: IntentAnalysis,
        modifications: Modification,
        originalSummary: string,
        originalStructuredData: StructuredData
    ): string {
        return `
# Step 3: Generate User Response and Validate

## User Message:
"${userMessage}"

## Intent:
${intent.intentType} - ${intent.userExpectation}

## Changes Made:
${modifications.changeDescription}

## Before and After:
Summary changed: ${modifications.modifiedSummary !== originalSummary ? 'Yes' : 'No'}
Structured data changed: ${JSON.stringify(modifications.modifiedStructuredData) !== JSON.stringify(originalStructuredData) ? 'Yes' : 'No'}

# Your Task
1. Verify the changes are appropriate and complete
2. Generate a natural, conversational response to the user that:
   - Acknowledges their request
   - Explains what was changed (if anything)
   - Answers their question (if it was a question)
   - Is friendly and helpful

Output a JSON object with:
- aiResponse: your conversational response to the user
- changesValid: boolean indicating if changes are valid
- validationNotes: any concerns or notes about the changes
        `.trim();
    }

    /**
     * Direct question response (no modifications needed)
     */
    static directQuestion(
        currentSummary: string,
        currentStructuredData: StructuredData,
        condensedContent: string,
        userMessage: string
    ): string {
        return `
Context: ${currentSummary}
Structured Data: ${JSON.stringify(currentStructuredData)}
Condensed Content: ${condensedContent}

User Question: "${userMessage}"

Provide a helpful, accurate answer based on the context and condensed content.
        `.trim();
    }

    /**
     * Simple modification (streamlined, no intent analysis)
     */
    static simpleModification(
        condensedContent: string,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): string {
        return `
# Execute Simple Modification

## Current Summary:
${currentSummary}

## Current Structured Data:
${JSON.stringify(currentStructuredData, null, 2)}

## Condensed Content Reference:
${condensedContent}

## User Request:
"${userMessage}"

# Your Task
Make the requested changes to the summary and/or structured data.
Be precise and only change what the user asked for.

Output a JSON object with:
- modifiedSummary: the updated summary (or unchanged if not modified)
- modifiedStructuredData: object with updated structured data (or unchanged if not modified)
- changeDescription: brief description of what was changed (e.g., "Shortened summary", "Added author information")
        `.trim();
    }

    /**
     * Simple response generation (for simple modifications)
     */
    static simpleResponse(
        userMessage: string,
        modifications: Modification
    ): string {
        return `
User requested: "${userMessage}"

Changes made: ${modifications.changeDescription}

Generate a brief, friendly response (1-2 sentences) acknowledging what was done.
Example: "I've shortened the summary as requested." or "Added the author information you mentioned."

Return ONLY the response text.
        `.trim();
    }
}
