/**
 * Application-specific type definitions for Synapse Extension
 *
 * Note: Chrome Built-in AI (Gemini Nano) type definitions is based on
 * https://developer.chrome.com/docs/ai/built-in
 */

// ===== Core Database Models =====

/**
 * Synapse knowledge node stored in IndexedDB
 */
export interface SynapseNode {
    id?: number;
    type: ContentType;
    url: string;
    title: string;
    createdAt: Date;
    updatedAt?: Date;
    summary?: string;
    structuredData?: Record<string, unknown>;
    chatHistory?: Array<{ sender: "user" | "system" | "assistant"; text: string }>;
}

/**
 * Link between two synapse nodes
 */
export interface SynapseLink {
    id?: number;
    sourceId: number;
    targetId: number;
    reason: string;
    createdAt: Date;
    type?: 'auto' | 'manual';
}

// ===== UI Component Types =====

/**
 * Chat message structure used in sidepanel
 */
export interface ChatMessage {
    sender: "user" | "system" | "assistant";
    text: string;
}

/**
 * Loading phase indicators for UI feedback
 */
export type LoadingPhase = "idle" | "capturing" | "condensing" | "summarizing" | "chatting" | "saving";

// ===== Content Extraction Types =====

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
    | 'product'
    | 'recipe'
    | 'tutorial'
    | 'news'
    | 'review'
    | 'generic';

/**
 * Condensed content structure that's optimized for AI processing
 * This structure significantly reduces token usage while preserving all essential information
 */
export interface CondensedPageContent {
    title: string;
    url: string;
    // Core content condensed to fit within token limits
    condensedContent: string;
    // Metadata directly from PageContent (no transformation)
    metadata: PageContent['metadata'];
    // Original length info for reference
    originalLength: number;
    condensedLength: number;
    compressionRate: number;
}

// ===== Standardized Page Content =====

/**
 * Standardized page content structure
 * All extractors must convert their specific formats to this unified structure
 * AI Services only interact with this interface - they don't need to know about extractor-specific details
 */
export interface PageContent {
    /** Page title */
    title: string;

    /** Page URL */
    url: string;

    /** Canonical full text (markdown or plain text) */
    fullText: string;

    /** Standardized metadata */
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
        /** Extractor-specific extra data (AI Services should not depend on this) */
        extra?: Record<string, unknown>;
    };

    /** Image URLs (for image context feature) */
    images?: string[];

    /** Links (for potential future features) */
    links?: string[]; // Currently unused but reserved for future use.
}

// Type definitions for structured data
/**
 * Structured data extracted from web page content
 * Flexible key-value pairs that can contain various types of information
 */
export type StructuredData = Record<string, unknown>;

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

// --- Chrome Built-in AI Additional APIs ---

export type LanguageDetectorAvailability = AIModelAvailability;

export interface LanguageDetectionResult {
    detectedLanguage: string;
    confidence: number;
}

export interface LanguageDetectorCreateOptions {
    monitor?: (monitor: EventTarget) => void;
    signal?: AbortSignal;
}

export interface LanguageDetectorSession {
    detect(text: string): Promise<LanguageDetectionResult[]>;
    destroy?: () => void;
}

export interface LanguageDetector {
    availability(): Promise<LanguageDetectorAvailability>;
    create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetectorSession>;
}

export interface LanguageDetectionRequestOptions extends LanguageDetectorCreateOptions {
    forceReload?: boolean;
}

export type TranslatorAvailability = AIModelAvailability;

export interface TranslatorAvailabilityOptions {
    sourceLanguage: string;
    targetLanguage: string;
}

export interface TranslatorCreateOptions extends TranslatorAvailabilityOptions {
    monitor?: (monitor: EventTarget) => void;
    signal?: AbortSignal;
}

export interface TranslatorSession {
    translate(text: string): Promise<string>;
    translateStreaming(text: string): Promise<ReadableStream<string>> | ReadableStream<string>;
    destroy?: () => void;
}

export interface Translator {
    availability(options: TranslatorAvailabilityOptions): Promise<TranslatorAvailability>;
    create(options: TranslatorCreateOptions): Promise<TranslatorSession>;
}

export interface TranslationRequestOptions extends TranslatorCreateOptions {
    forceReload?: boolean;
}
