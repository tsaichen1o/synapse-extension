/**
 * JSON Schema definitions and TypeScript types for AI service responses
 * These schemas are used with the Prompt API's native responseConstraint feature
 */

// ============================================================================
// ChatService Types and Schemas
// ============================================================================

/**
 * Intent analysis response from ChatService
 */
export interface IntentAnalysis {
    intentType: "question" | "modify_summary" | "modify_data" | "add_info" | "remove_info" | "clarify";
    targetArea: "summary" | "structuredData" | "both" | "none";
    specificChanges: string[];
    needsOriginalContent: boolean;
    userExpectation: string;
}

/**
 * Schema for intent analysis in ChatService
 */
export const intentAnalysisSchema = {
    type: "object",
    properties: {
        intentType: {
            type: "string",
            enum: ["question", "modify_summary", "modify_data", "add_info", "remove_info", "clarify"]
        },
        targetArea: {
            type: "string",
            enum: ["summary", "structuredData", "both", "none"]
        },
        specificChanges: {
            type: "array",
            items: { type: "string" }
        },
        needsOriginalContent: {
            type: "boolean"
        },
        userExpectation: {
            type: "string"
        }
    },
    required: ["intentType", "targetArea", "specificChanges", "needsOriginalContent", "userExpectation"]
};

/**
 * Modification execution response from ChatService
 */
export interface Modification {
    modifiedSummary: string;
    modifiedStructuredData: Record<string, unknown>;
    changeDescription: string;
}

/**
 * Schema for modification execution in ChatService
 */
export const modificationSchema = {
    type: "object",
    properties: {
        modifiedSummary: {
            type: "string"
        },
        modifiedStructuredData: {
            type: "object",
            additionalProperties: true
        },
        changeDescription: {
            type: "string"
        }
    },
    required: ["modifiedSummary", "modifiedStructuredData", "changeDescription"]
};

/**
 * Response generation result from ChatService
 */
export interface ResponseGeneration {
    aiResponse: string;
    changesValid: boolean;
    validationNotes: string;
}

/**
 * Schema for response generation in ChatService
 */
export const responseGenerationSchema = {
    type: "object",
    properties: {
        aiResponse: {
            type: "string"
        },
        changesValid: {
            type: "boolean"
        },
        validationNotes: {
            type: "string"
        }
    },
    required: ["aiResponse", "changesValid", "validationNotes"]
};
