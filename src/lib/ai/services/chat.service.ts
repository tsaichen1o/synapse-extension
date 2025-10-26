import { StructuredData, ChatResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { normalizeStructuredData } from './utils';
import {
    intentAnalysisSchema,
    modificationSchema,
    responseGenerationSchema
} from './schemas';
import type { IntentAnalysis, Modification, ResponseGeneration } from './schemas';
import { ChatPrompts } from './prompts';
import { ChatError, AIErrors } from '../../errors';

/**
 * Intent type for quick routing
 */
type QuickIntent = 'simple-question' | 'simple-modification' | 'complex';

/**
 * Chat service that uses adaptive processing based on message complexity
 * Accepts condensed page content for efficient AI processing
 * 
 * Routing strategy:
 * - Simple questions → 1 AI call (direct answer)
 * - Simple modifications → 2 AI calls (modify + respond)
 * - Complex requests → 3 AI calls (full pipeline)
 */
export class ChatService {
    constructor(private ai: AI) { }

    /**
     * Chat with AI to refine summaries and structured data using adaptive processing
     * 
     * Routes to different strategies based on message complexity:
     * - Simple questions get direct answers (1 step)
     * - Simple modifications get streamlined processing (2 steps)
     * - Complex requests get full multi-step pipeline (3 steps)
     * 
     * @param input - Condensed page content
     * @param currentSummary - Current summary text
     * @param currentStructuredData - Current structured data
     * @param userMessage - User's chat message
     * @returns Updated summary, structured data, and AI response
     */
    async chat(
        input: CondensedPageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            console.log("🔄 Starting adaptive chat processing...", userMessage);

            const quickIntent = this.detectQuickIntent(userMessage);
            console.log(`🎯 Quick intent: ${quickIntent}`);

            // Route based on intent complexity
            switch (quickIntent) {
                case 'simple-question':
                    console.log("❓ Routing to simple question handler (1 AI call)");
                    return await this.handleSimpleQuestion(
                        userMessage,
                        currentSummary,
                        currentStructuredData,
                        input.condensedContent,
                    );

                case 'simple-modification':
                    console.log("⚡ Routing to simple modification handler (2 AI calls)");
                    return await this.handleSimpleModification(
                        userMessage,
                        currentSummary,
                        currentStructuredData,
                        input.condensedContent,
                    );

                case 'complex':
                    console.log("🔧 Routing to complex handler (3 AI calls)");
                    return await this.handleComplexChat(
                        input,
                        currentSummary,
                        currentStructuredData,
                        userMessage,
                    );
            }

        } catch (error) {
            console.error("❌ Error in adaptive chat:", error);
            throw error;
        }
    }

    /**
     * Quick intent detection using pattern matching (no AI call needed)
     */
    private detectQuickIntent(message: string): QuickIntent {
        const lowerMsg = message.toLowerCase().trim();

        // Simple question patterns
        const questionPatterns = [
            /^(what|who|when|where|why|how|is|are|can|could|would|does|did|will|shall)\s/i,
            /\?$/,
            /^(tell me|explain|describe|show me)\s/i,
            /^(list|summarize|give me)\s/i
        ];

        if (questionPatterns.some(pattern => pattern.test(lowerMsg))) {
            // Additional check: if it's asking to modify something, it's not a simple question
            const modificationKeywords = ['change', 'update', 'modify', 'edit', 'add', 'remove', 'delete', 'fix'];
            if (!modificationKeywords.some(keyword => lowerMsg.includes(keyword))) {
                return 'simple-question';
            }
        }

        // Simple modification patterns
        const simpleModPatterns = [
            /^(add|remove|delete)\s/i,
            /^(change|update|modify|edit)\s(the\s)?(summary|title|author|date)/i,
            /^(make it|make this)\s(shorter|longer|simpler|more detailed)/i,
            /^shorten/i,
            /^simplify/i
        ];

        if (simpleModPatterns.some(pattern => pattern.test(lowerMsg))) {
            return 'simple-modification';
        }

        // Everything else is complex
        return 'complex';
    }

    /**
     * Handle simple questions with direct answer (1 AI call)
     */
    private async handleSimpleQuestion(
        userMessage: string,
        currentSummary: string,
        currentStructuredData: StructuredData,
        content: string
    ): Promise<ChatResponse> {
        try {
            const prompt = ChatPrompts.directQuestion(
                currentSummary,
                currentStructuredData,
                content,
                userMessage
            );

            const aiResponse = await this.ai.prompt(prompt);

            return {
                summary: currentSummary,
                structuredData: currentStructuredData,
                aiResponse: aiResponse.trim(),
            };
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw new ChatError(
                'response-generation',
                'Failed to answer question',
                true,
                'Having trouble answering your question. Please try rephrasing.',
                aiError
            );
        }
    }

    /**
     * Handle simple modifications (2 AI calls: modify + respond)
     */
    private async handleSimpleModification(
        userMessage: string,
        currentSummary: string,
        currentStructuredData: StructuredData,
        content: string
    ): Promise<ChatResponse> {
        try {
            // Step 1: Execute the modification
            console.log("⚙️  Step 1: Executing modification...");
            const modificationPrompt = ChatPrompts.simpleModification(
                content,
                currentSummary,
                currentStructuredData,
                userMessage
            );

            const modifications = await this.ai.promptStructured<Modification>(
                modificationPrompt,
                modificationSchema
            );
            console.log("✓ Modification complete:", modifications.changeDescription);

            // Step 2: Generate user response
            console.log("✅ Step 2: Generating response...");
            const responsePrompt = ChatPrompts.simpleResponse(userMessage, modifications);
            const aiResponse = await this.ai.prompt(responsePrompt);
            console.log("✓ Response generated");

            return {
                summary: modifications.modifiedSummary,
                structuredData: normalizeStructuredData(modifications.modifiedStructuredData),
                aiResponse: aiResponse.trim(),
            };

        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.modificationFailed(aiError);
        }
    }

    /**
     * Handle complex chat with full 3-step pipeline
     */
    private async handleComplexChat(
        input: CondensedPageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            // Step 1: Analyze user intent
            console.log("🧠 Step 1: Analyzing user intent...");
            const intentPrompt = ChatPrompts.intentAnalysis(currentSummary, currentStructuredData, userMessage);
            const intent = await this.ai.promptStructured<IntentAnalysis>(intentPrompt, intentAnalysisSchema);
            console.log("✓ Intent analysis:", intent);

            // If user is just asking a question without modifications, skip to response
            if (intent.intentType === 'question' && intent.targetArea === 'none') {
                console.log("❓ Detected as question-only, using simple handler");
                return await this.handleSimpleQuestion(userMessage, currentSummary, currentStructuredData, input.condensedContent);
            }

            // Step 2: Execute modifications
            console.log("⚙️  Step 2: Executing modifications...");
            const modificationPrompt = ChatPrompts.modification(input.condensedContent, currentSummary, currentStructuredData, userMessage, intent);
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

            console.log("✅ Complex chat processing complete!");

            return {
                summary: modifications.modifiedSummary,
                structuredData: normalizeStructuredData(modifications.modifiedStructuredData),
                aiResponse: responseData.aiResponse,
            };

        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));

            if (aiError.message.includes('intent')) {
                throw AIErrors.intentAnalysisFailed(aiError);
            } else if (aiError.message.includes('modif')) {
                throw AIErrors.modificationFailed(aiError);
            }

            throw new ChatError(
                'response-generation',
                'Complex chat failed',
                true,
                'Having trouble processing your request. Trying a simpler approach...',
                aiError
            );
        }
    }
}
