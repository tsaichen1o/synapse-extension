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
import { ChatPrompts } from '../prompts';

/**
 * Chat service that uses an AI instance with multi-step iterative processing
 * Can work with either raw PageContent or pre-condensed CondensedPageContent
 */
export class ChatService {
    constructor(private ai: AI) { }

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
                : (input.mainContent || input.abstract || input.fullText);

            console.log(`📦 Input type: ${isCondensed ? 'Condensed' : 'Raw'} (${content.length} chars)`);

            // Step 1: Analyze user intent
            console.log("🧠 Step 1: Analyzing user intent...");
            const intentPrompt = ChatPrompts.intentAnalysis(input, currentSummary, currentStructuredData, userMessage);
            const intent = await this.ai.promptStructured<IntentAnalysis>(intentPrompt, intentAnalysisSchema);
            console.log("✓ Intent analysis:", intent);

            // If user is just asking a question without modifications, skip to response
            if (intent.intentType === 'question' && intent.targetArea === 'none') {
                console.log("❓ User is asking a question, generating direct response...");
                const directResponsePrompt = ChatPrompts.directQuestion(currentSummary, currentStructuredData, content, userMessage);

                const directResponse = await this.ai.prompt(directResponsePrompt);
                return {
                    summary: currentSummary,
                    structuredData: currentStructuredData,
                    aiResponse: directResponse.trim(),
                };
            }

            // Step 2: Execute modifications
            console.log("⚙️  Step 2: Executing modifications...");
            const modificationPrompt = ChatPrompts.modification(content, currentSummary, currentStructuredData, userMessage, intent);
            const modifications = await this.ai.promptStructured<Modification>(modificationPrompt, modificationSchema);
            console.log("✓ Modifications complete:", modifications.changeDescription);

            // Step 3: Generate user response and validate
            console.log("✅ Step 3: Generating user response and validating...");
            const responsePrompt = ChatPrompts.responseGeneration(userMessage, intent, modifications, currentSummary, currentStructuredData);
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
                : (input.mainContent || input.abstract || input.fullText);
            const title = input.title;

            const promptText = ChatPrompts.fallback(content, title, currentSummary, currentStructuredData, userMessage);

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
