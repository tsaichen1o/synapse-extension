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
    modifiedStructuredData: Record<string, any>;
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

/**
 * Fallback chat response (used when multi-step processing fails)
 */
export interface ChatResponseFallback {
    summary: string;
    structuredData: Record<string, any>;
    aiResponse: string;
}

/**
 * Schema for fallback chat response
 */
export const chatResponseSchema = {
    type: "object",
    properties: {
        summary: {
            type: "string"
        },
        structuredData: {
            type: "object",
            additionalProperties: true
        },
        aiResponse: {
            type: "string"
        }
    },
    required: ["summary", "structuredData", "aiResponse"]
};

// ============================================================================
// CondenseService Types and Schemas
// ============================================================================

/**
 * Metadata extraction result from CondenseService
 */
export interface MetadataExtraction {
    description: string;
    mainTopics: string[];
    keyEntities: string[];
    contentType: "article" | "documentation" | "research-paper" | "blog" | "news" | "tutorial" | "other";
}

/**
 * Schema for metadata extraction in CondenseService
 */
export const metadataExtractionSchema = {
    type: "object",
    properties: {
        description: {
            type: "string"
        },
        mainTopics: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5
        },
        keyEntities: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5
        },
        contentType: {
            type: "string",
            enum: ["article", "documentation", "research-paper", "blog", "news", "tutorial", "other"]
        }
    },
    required: ["description", "mainTopics", "keyEntities", "contentType"]
};

// ============================================================================
// SummarizeService Types and Schemas
// ============================================================================

/**
 * Initial extraction result from SummarizeService
 */
export interface ContentExtraction {
    mainTopic: string;
    keyThemes: string[];
    importantFacts: string[];
    targetAudience: string;
}

/**
 * Schema for initial extraction in SummarizeService
 */
export const extractionSchema = {
    type: "object",
    properties: {
        mainTopic: {
            type: "string"
        },
        keyThemes: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5
        },
        importantFacts: {
            type: "array",
            items: { type: "string" },
            minItems: 1
        },
        targetAudience: {
            type: "string"
        }
    },
    required: ["mainTopic", "keyThemes", "importantFacts", "targetAudience"]
};

/**
 * Structured data extraction result (flexible object with any properties)
 */
export type StructuredDataExtraction = Record<string, any>;

/**
 * Schema for structured data extraction in SummarizeService
 */
export const structuredDataSchema = {
    type: "object",
    additionalProperties: true,
    minProperties: 1
};

/**
 * Fallback summarization response (used when multi-step processing fails)
 */
export interface SummaryResponseFallback {
    summary: string;
    structuredData: Record<string, any>;
}

/**
 * Schema for fallback summarization
 */
export const summaryResponseSchema = {
    type: "object",
    properties: {
        summary: {
            type: "string"
        },
        structuredData: {
            type: "object",
            additionalProperties: true
        }
    },
    required: ["summary", "structuredData"]
};
