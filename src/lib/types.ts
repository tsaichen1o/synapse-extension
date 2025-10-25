/**
 * Application-specific type definitions for Synapse Extension
 *
 * Note: Chrome Built-in AI (Gemini Nano) type definitions is based on
 * https://developer.chrome.com/docs/ai/built-in
 */


/**
 * Unified section structure for all content types
 * Can represent sections in research papers, articles, documentation, etc.
 */
export interface ContentSection {
    /** Heading level (1 = h1, 2 = h2, etc.) */
    level: number;
    /** Section title/heading */
    title: string;
    /** Section content (plain text or markdown) */
    content: string;
    /** Nested subsections */
    subsections?: ContentSection[];
    /** Optional section number (e.g., "1", "2.1", "3.2.1") */
    number?: string;
    /** Optional section ID for reference */
    id?: string;
}

/**
 * Content type classification
 */
export type ContentType =
    | 'research-paper'
    | 'article'
    | 'documentation'
    | 'blog'
    | 'wiki'
    | 'generic';

/**
 * Paper-specific structured metadata
 */
export interface PaperStructure {
    researchQuestion?: string;
    mainContribution?: string;
    methodology?: string;
    keyFindings?: string;
}

/**
 * Condensed content structure that's optimized for AI processing
 * This structure significantly reduces token usage while preserving all essential information
 */
export interface CondensedPageContent {
    title: string;
    url: string;
    // Core content condensed to fit within token limits
    condensedContent: string;
    // Key metadata extracted
    metadata: {
        description: string;
        mainTopics: string[];
        keyEntities: string[];
        authors?: string[];
        contentType: ContentType;
        paperStructure?: PaperStructure;
    };
    // Original length info for reference
    originalLength: number;
    condensedLength: number;
    compressionRatio: number;
}

// ===== Standardized Page Content =====

/**
 * Standardized page content structure
 * All extractors must convert their specific formats to this unified structure
 * AI Services only interact with this interface - they don't need to know about extractor-specific details
 */
export interface PageContent {
    // === Basic Information ===
    /** Page title */
    title: string;
    /** Page URL */
    url: string;

    // === Main Content ===
    /** Abstract or summary (if available) */
    abstract?: string;
    /** Main content formatted as markdown */
    mainContent: string;
    /** Original full text (for reference) */
    fullText: string;

    // === Standardized Metadata ===
    metadata: {
        /** Authors (for papers, articles with bylines) */
        authors?: string[];
        /** Publication or last modified date */
        publishDate?: string;
        /** Content type classification */
        contentType: ContentType;
        /** Tags or keywords */
        tags?: string[];
        /** Meta description from HTML */
        description?: string;
        /** Structured sections (if content has clear sections) */
        sections?: ContentSection[];
        /** Research paper specific structure */
        paperStructure?: PaperStructure;
        /** Extractor-specific extra data (AI Services should not depend on this) */
        extra?: Record<string, any>;
    };

    // === Optional Fields ===
    /** Image URLs (for image context feature) */
    images?: string[];
    /** Links (for potential future features) */
    links?: string[];

    // === Extractor Information ===
    /** Type of extractor used (for debugging/logging only) */
    extractorType: 'arxiv' | 'wikipedia' | 'generic' | 'readability';
}

// Type definitions for structured data
/**
 * Structured data extracted from web page content
 * Flexible key-value pairs that can contain various types of information
 */
export type StructuredData = Record<string, any>;

// Type definitions for AI responses
export interface SummaryResponse {
    /** Human-readable summary text (usually Chinese for this project) */
    summary: string;
    /** Structured key/value pairs extracted from the page */
    structuredData: StructuredData;
}

export interface ChatResponse extends SummaryResponse {
    /** A user-facing conversational response from the AI in addition to the structured data */
    aiResponse: string;
}

// --- Chrome Built-in AI Type Definitions (DO NOT EDIT) ---

/**
 * Availability status of the language model
 */
export type AIModelAvailability = "unavailable" | "downloadable" | "downloading" | "available";

/**
 * Session configuration options for creating a language model session
 */
export interface AILanguageModelCreateOptions {
    /** Controls randomness in output (0.0-2.0, higher = more creative) */
    temperature?: number;
    /** Number of top tokens to consider (integer, higher = more diverse) */
    topK?: number;
    /** Array of previous conversation turns for context */
    initialPrompts?: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>;
    /** Signal to abort session creation */
    signal?: AbortSignal;
    /** Optional monitor callback for download / progress events */
    monitor?: (monitor: EventTarget) => void;
    /** Expected input types and languages */
    expectedInputs?: Array<{
        type: "text" | "image" | "audio";
        /** Supported languages: "en", "ja", "es" (from Chrome 140+) */
        languages?: Array<"en" | "ja" | "es">;
    }>;
    /** Expected output types and languages */
    expectedOutputs?: Array<{
        type: "text" | "image" | "audio";
        /** Supported languages: "en", "ja", "es" (from Chrome 140+) */
        languages?: Array<"en" | "ja" | "es">;
    }>;
}

/**
 * Prompt options for structured output
 */
export interface AILanguageModelPromptOptions {
    /** Signal to abort the prompt */
    signal?: AbortSignal;
    /** JSON Schema to constrain response format - pass the schema object directly */
    responseConstraint?: object;
    /** Omit the response constraint from counting against input quota */
    omitResponseConstraintInput?: boolean;
}

/**
 * Multimodal content types for AI input
 */
export interface AITextContent {
    type: "text";
    value: string;
}

export interface AIImageContent {
    type: "image";
    value: FileList | Blob | string; // Support various image formats
}

export interface AIAudioContent {
    type: "audio";
    value: FileList | Blob | string;
}

export type AIContentPart = AITextContent | AIImageContent | AIAudioContent;

/**
 * Message structure for multimodal input
 */
export interface AIMessage {
    role: "user" | "assistant" | "system";
    content: string | AIContentPart[];
}

/**
 * AI Language Model session interface (Gemini Nano)
 */
export interface AILanguageModelSession {
    /**
     * Send a prompt and get the complete response
     */
    prompt(text: string, options?: AILanguageModelPromptOptions): Promise<string>;

    /**
     * Send a prompt and get a streaming response
     */
    promptStreaming(text: string, options?: AILanguageModelPromptOptions): ReadableStream<string>;

    /**
     * Append context to the session (supports multimodal input)
     */
    append(messages: AIMessage[]): Promise<void>;

    /**
     * Clone the session to reset context while keeping initial prompts
     */
    clone(): Promise<AILanguageModelSession>;

    /**
     * Clean up session resources
     */
    destroy(): void;

    /** Current token usage count */
    inputUsage?: number;

    /** Maximum allowed tokens for this session */
    inputQuota?: number;
}

/**
 * Chrome Built-in AI Language Model API
 */
export interface AILanguageModel {
    /**
     * Check if the language model is available on this device
     */
    availability(): Promise<AIModelAvailability>;

    /**
     * Get default parameters for the model
     */
    params(): Promise<{
        defaultTemperature: number;
        defaultTopK: number;
        maxTopK: number;
    }>;

    /**
     * Create a new language model session
     * Requires user interaction if model needs to be downloaded
     */
    create(options?: AILanguageModelCreateOptions): Promise<AILanguageModelSession>;
}
