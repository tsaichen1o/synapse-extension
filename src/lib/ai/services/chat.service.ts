import { PageContent, StructuredData, ChatResponse } from '../../types';
import type { AI } from '../ai';
import { parseAIJSON } from './utils';

/**
 * Chat service that uses an AI instance with multi-step iterative processing
 */
export class ChatService {
    constructor(private ai: AI) { }

    /**
     * Step 1: Understand user intent and what needs to be modified
     */
    private buildIntentAnalysisPrompt(
        pageContent: PageContent,
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

Return in JSON format:
{
  "intentType": "question|modify_summary|modify_data|add_info|remove_info|clarify",
  "targetArea": "summary|structuredData|both|none",
  "specificChanges": ["Change 1", "Change 2"],
  "needsOriginalContent": true/false,
  "userExpectation": "Brief description of what user expects as output"
}
        `.trim();
    }

    /**
     * Step 2: Execute modifications based on intent analysis
     */
    private buildModificationPrompt(
        pageContent: PageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string,
        intent: any
    ): string {
        const relevantContent = intent.needsOriginalContent
            ? `\n## Original Content Reference:\n${(pageContent.content || pageContent.abstract || pageContent.fullText)}...`
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

Return in JSON format:
{
  "modifiedSummary": "Updated summary or unchanged if not modified",
  "modifiedStructuredData": { "Updated structured data or unchanged if not modified" },
  "changeDescription": "Brief description of what was changed"
}
        `.trim();
    }

    /**
     * Step 3: Generate user-facing response and validate changes
     */
    private buildResponseGenerationPrompt(
        userMessage: string,
        intent: any,
        modifications: any,
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

Return in JSON format:
{
  "aiResponse": "Your conversational response to the user",
  "changesValid": true/false,
  "validationNotes": "Any concerns or notes about the changes"
}
        `.trim();
    }

    /**
     * Chat with AI to refine summaries and structured data using multi-step processing
     */
    async chat(
        pageContent: PageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            console.log("🔄 Starting multi-step chat processing...");
            console.log("💬 User message:", userMessage);

            // Step 1: Analyze user intent
            console.log("🧠 Step 1: Analyzing user intent...");
            const intentPrompt = this.buildIntentAnalysisPrompt(
                pageContent,
                currentSummary,
                currentStructuredData,
                userMessage
            );
            const intentResult = await this.ai.prompt(intentPrompt);
            const intent = parseAIJSON(intentResult);
            console.log("✓ Intent analysis:", intent);

            // If user is just asking a question without modifications, skip to response
            if (intent.intentType === 'question' && intent.targetArea === 'none') {
                console.log("❓ User is asking a question, generating direct response...");
                const directResponsePrompt = `
Context: ${currentSummary}
Structured Data: ${JSON.stringify(currentStructuredData)}
Original Content: ${pageContent.content || pageContent.abstract || pageContent.fullText}

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
                pageContent,
                currentSummary,
                currentStructuredData,
                userMessage,
                intent
            );
            const modificationResult = await this.ai.prompt(modificationPrompt);
            const modifications = parseAIJSON(modificationResult);
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
            const responseResult = await this.ai.prompt(responsePrompt);
            const responseData = parseAIJSON(responseResult);
            console.log("✓ Response generated");

            // Log validation concerns if any
            if (!responseData.changesValid) {
                console.warn("⚠️  Validation concern:", responseData.validationNotes);
            }

            console.log("✅ Multi-step chat processing complete!");

            return {
                summary: modifications.modifiedSummary,
                structuredData: modifications.modifiedStructuredData,
                aiResponse: responseData.aiResponse,
            };

        } catch (error) {
            console.error("❌ Error in multi-step chat:", error);
            // Fallback to simple chat if multi-step fails
            console.warn("⚠️  Falling back to single-step chat...");
            return this.fallbackChat(pageContent, currentSummary, currentStructuredData, userMessage);
        }
    }

    /**
     * Fallback to simple single-step chat if multi-step fails
     */
    private async fallbackChat(
        pageContent: PageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            const structuredDataString = JSON.stringify(currentStructuredData, null, 2);

            const promptText = `
You are helping refine a web page summary and structured data.

Current Summary: ${currentSummary}
Current Structured Data: ${structuredDataString}
Original Content: ${pageContent.title} - ${pageContent.content || pageContent.fullText}

User Request: "${userMessage}"

Update the summary and structured data according to the user's request, or answer their question.

Return in JSON format:
{
  "summary": "Updated or unchanged summary",
  "structuredData": { "Updated or unchanged data" },
  "aiResponse": "Your conversational response to the user"
}
            `.trim();

            const result = await this.ai.prompt(promptText);
            const jsonResult = parseAIJSON<ChatResponse>(result);

            return {
                summary: jsonResult.summary,
                structuredData: jsonResult.structuredData,
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
