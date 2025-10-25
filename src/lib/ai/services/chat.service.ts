import { PageContent, StructuredData, ChatResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { normalizeStructuredData } from './utils';
import {
    intentAnalysisSchema,
    modificationSchema,
    responseGenerationSchema,
    chatResponseSchema
} from './schemas';
import type { IntentAnalysis, Modification, ResponseGeneration } from './schemas';

/**
 * Chat service that uses an AI instance with multi-step iterative processing
 * Can work with either raw PageContent or pre-condensed CondensedPageContent
 */
export class ChatService {
    constructor(private ai: AI) { }

    /**
     * Step 1: Understand user intent and what needs to be modified
     */
    private buildIntentAnalysisPrompt(
        input: PageContent | CondensedPageContent,
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
    private buildModificationPrompt(
        content: string,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string,
        intent: IntentAnalysis
    ): string {
        const relevantContent = intent.needsOriginalContent
            ? `\n## Original Content Reference:\n${content}`
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
    private buildResponseGenerationPrompt(
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
     * Chat with AI to refine summaries and structured data using multi-step processing
     * Works with either PageContent or CondensedPageContent
     */
    async chat(
        input: PageContent | CondensedPageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            console.log("🔄 Starting multi-step chat processing...");
            console.log("💬 User message:", userMessage);

            // Determine if input is condensed or raw
            const isCondensed = 'condensedContent' in input;
            const content = isCondensed
                ? input.condensedContent
                : (input.content || input.abstract || input.fullText);

            console.log(`📦 Input type: ${isCondensed ? 'Condensed' : 'Raw'} (${content.length} chars)`);

            // Step 1: Analyze user intent
            console.log("🧠 Step 1: Analyzing user intent...");
            const intentPrompt = this.buildIntentAnalysisPrompt(
                input,
                currentSummary,
                currentStructuredData,
                userMessage
            );
            const intent = await this.ai.promptStructured<IntentAnalysis>(intentPrompt, intentAnalysisSchema);
            console.log("✓ Intent analysis:", intent);

            // If user is just asking a question without modifications, skip to response
            if (intent.intentType === 'question' && intent.targetArea === 'none') {
                console.log("❓ User is asking a question, generating direct response...");
                const directResponsePrompt = `
Context: ${currentSummary}
Structured Data: ${JSON.stringify(currentStructuredData)}
Original Content: ${content}

User Question: "${userMessage}"

Provide a helpful, accurate answer based on the context and original content.
                `.trim();

                const directResponse = await this.ai.prompt(directResponsePrompt);
                return {
                    summary: currentSummary,
                    structuredData: currentStructuredData,
                    aiResponse: directResponse.trim(),
                };
            }

            // Step 2: Execute modifications
            console.log("⚙️  Step 2: Executing modifications...");
            const modificationPrompt = this.buildModificationPrompt(
                content,
                currentSummary,
                currentStructuredData,
                userMessage,
                intent
            );
            const modifications = await this.ai.promptStructured<Modification>(modificationPrompt, modificationSchema);
            console.log("✓ Modifications complete:", modifications.changeDescription);

            // Step 3: Generate user response and validate
            console.log("✅ Step 3: Generating user response and validating...");
            const responsePrompt = this.buildResponseGenerationPrompt(
                userMessage,
                intent,
                modifications,
                currentSummary,
                currentStructuredData
            );
            const responseData = await this.ai.promptStructured<ResponseGeneration>(responsePrompt, responseGenerationSchema);
            console.log("✓ Response generated");

            // Log validation concerns if any
            if (!responseData.changesValid) {
                console.warn("⚠️  Validation concern:", responseData.validationNotes);
            }

            console.log("✅ Multi-step chat processing complete!");

            return {
                summary: modifications.modifiedSummary,
                structuredData: normalizeStructuredData(modifications.modifiedStructuredData),
                aiResponse: responseData.aiResponse,
            };

        } catch (error) {
            console.error("❌ Error in multi-step chat:", error);
            // Fallback to simple chat if multi-step fails
            console.warn("⚠️  Falling back to single-step chat...");
            return this.fallbackChat(input, currentSummary, currentStructuredData, userMessage);
        }
    }

    /**
     * Fallback to simple single-step chat if multi-step fails
     */
    private async fallbackChat(
        input: PageContent | CondensedPageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            const isCondensed = 'condensedContent' in input;
            const content = isCondensed
                ? input.condensedContent
                : (input.content || input.abstract || input.fullText);
            const title = input.title;
            const structuredDataString = JSON.stringify(currentStructuredData, null, 2);

            const promptText = `
You are helping refine a web page summary and structured data.

Current Summary: ${currentSummary}
Current Structured Data: ${structuredDataString}
Original Content: ${title} - ${content}

User Request: "${userMessage}"

Update the summary and structured data according to the user's request, or answer their question.

Output a JSON object with:
- summary: updated or unchanged summary
- structuredData: object with updated or unchanged data
- aiResponse: your conversational response to the user
            `.trim();

            const jsonResult = await this.ai.promptStructured<ChatResponse>(promptText, chatResponseSchema);

            return {
                summary: jsonResult.summary,
                structuredData: normalizeStructuredData(jsonResult.structuredData),
                aiResponse: jsonResult.aiResponse || "I've processed your request.",
            };

        } catch (error) {
            console.error("❌ Fallback chat also failed:", error);
            return {
                summary: currentSummary,
                structuredData: currentStructuredData,
                aiResponse: `Sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}. Please try rephrasing your request.`,
            };
        }
    }
}
