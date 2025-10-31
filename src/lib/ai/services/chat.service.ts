import { StructuredData, ChatResponse, CondensedPageContent } from '../../types';
import type { AI } from '../ai';
import { normalizeStructuredData } from './utils';
import { chatResponseSchema } from './schemas';
import type { ChatResponseGeneration } from './schemas';
import { ChatPrompts } from './prompts';
import { ChatError } from '../../errors';

/**
 * Chat service using a single-pass approach for better UX
 * 
 * Strategy:
 * - One comprehensive AI call handles all chat interactions
 * - AI decides whether to modify summary/structured data or just answer
 * - Faster, simpler, and more reliable than multi-pass approaches
 */
export class ChatService {
    constructor(private ai: AI) { }

    /**
     * Chat with AI to refine summaries and structured data using a single-pass approach
     * 
     * Single comprehensive AI call that:
     * - Understands user intent implicitly
     * - Decides whether to modify summary/structured data or just answer questions
     * - Provides a conversational response
     * - All in one go for better UX and faster response times
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
            console.log("� Processing chat message:", userMessage);

            // Single AI call with comprehensive prompt
            const prompt = ChatPrompts.singlePassChat(
                input.condensedContent,
                currentSummary,
                currentStructuredData,
                userMessage
            );

            const response = await this.ai.promptStructured<ChatResponseGeneration>(
                prompt,
                chatResponseSchema
            );

            console.log("✅ Chat processing complete");

            return {
                summary: response.modifiedSummary,
                structuredData: normalizeStructuredData(response.modifiedStructuredData),
                aiResponse: response.aiResponse,
            };

        } catch (error) {
            console.error("❌ Error in chat:", error);
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw new ChatError(
                'chat-processing',
                'Failed to process chat message',
                true,
                'Having trouble processing your message. Please try again or rephrase.',
                aiError
            );
        }
    }
}
