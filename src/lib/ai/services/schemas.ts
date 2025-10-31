/**
 * JSON Schema definitions and TypeScript types for AI service responses
 * These schemas are used with the Prompt API's native responseConstraint feature
 */

// ============================================================================
// ChatService Types and Schemas
// ============================================================================

/**
 * Single-pass chat response that handles all chat interactions in one AI call
 */
export interface ChatResponseGeneration {
    /** The potentially modified summary (same as current if no changes needed) */
    modifiedSummary: string;
    /** The potentially modified structured data (same as current if no changes needed) */
    modifiedStructuredData: Record<string, unknown>;
    /** Conversational response to the user */
    aiResponse: string;
}

/**
 * Schema for single-pass chat response
 */
export const chatResponseSchema = {
    type: "object",
    properties: {
        modifiedSummary: {
            type: "string",
            description: "The summary, potentially modified based on user request. If no changes needed, return the current summary unchanged."
        },
        modifiedStructuredData: {
            type: "object",
            additionalProperties: true,
            description: "The structured data, potentially modified based on user request. If no changes needed, return the current structured data unchanged."
        },
        aiResponse: {
            type: "string",
            description: "A conversational response to the user explaining what was done or answering their question"
        }
    },
    required: ["modifiedSummary", "modifiedStructuredData", "aiResponse"]
};
