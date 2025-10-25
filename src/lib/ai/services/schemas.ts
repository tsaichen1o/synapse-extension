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
    authors?: string[];
    contentType: "article" | "documentation" | "research-paper" | "blog" | "wiki" | "generic";
    paperStructure?: {
        researchQuestion?: string;
        mainContribution?: string;
        methodology?: string;
        keyFindings?: string;
    };
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
            items: { type: "string" }
        },
        keyEntities: {
            type: "array",
            items: { type: "string" }
        },
        authors: {
            type: "array",
            items: { type: "string" }
        },
        contentType: {
            type: "string",
            enum: ["article", "documentation", "research-paper", "blog", "wiki", "generic"]
        },
        paperStructure: {
            type: "object",
            properties: {
                researchQuestion: { type: "string" },
                mainContribution: { type: "string" },
                methodology: { type: "string" },
                keyFindings: { type: "string" }
            }
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
            items: { type: "string" }
        },
        importantFacts: {
            type: "array",
            items: { type: "string" }
        },
        targetAudience: {
            type: "string"
        }
    },
    required: ["mainTopic", "keyThemes", "importantFacts", "targetAudience"]
};

/**
 * Structured data extraction result (flattened structure)
 */
export interface StructuredDataExtraction {
    // Factual entities (Who, What, Where, When)
    authors?: string[];
    organizations?: string[];
    mentioned_people?: string[];
    locations?: string[];
    key_events?: string[];
    external_references?: string[];

    // Conceptual & Technical entities (How, Why)
    key_concepts?: string[];
    technologies_tools?: string[];
    methodologies?: string[];
    code_elements?: string[];

    // Relational & Purpose-Driven entities
    problems_discussed?: string[];
    solutions_proposed?: string[];
    comparisons?: string[];

    // Data & Media entities
    datasets_mentioned?: string[];
    data_sources?: string[];
    mentioned_media?: string[];
}

/**
 * Schema for structured data extraction in SummarizeService
 */
export const structuredDataSchema = {
    type: "object",
    properties: {
        // Factual entities
        authors: { type: "array", items: { type: "string" } },
        organizations: { type: "array", items: { type: "string" } },
        mentioned_people: { type: "array", items: { type: "string" } },
        locations: { type: "array", items: { type: "string" } },
        key_events: { type: "array", items: { type: "string" } },
        external_references: { type: "array", items: { type: "string" } },

        // Conceptual & Technical entities
        key_concepts: { type: "array", items: { type: "string" } },
        technologies_tools: { type: "array", items: { type: "string" } },
        methodologies: { type: "array", items: { type: "string" } },
        code_elements: { type: "array", items: { type: "string" } },

        // Relational & Purpose-Driven entities
        problems_discussed: { type: "array", items: { type: "string" } },
        solutions_proposed: { type: "array", items: { type: "string" } },
        comparisons: { type: "array", items: { type: "string" } },

        // Data & Media entities
        datasets_mentioned: { type: "array", items: { type: "string" } },
        data_sources: { type: "array", items: { type: "string" } },
        mentioned_media: { type: "array", items: { type: "string" } }
    },
    required: [
        "authors"
    ],
    additionalProperties: false
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
