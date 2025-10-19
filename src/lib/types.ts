/**
 * Chrome Built-in AI (Gemini Nano) Type Definitions
 * Based on the experimental Prompt API available in Chrome 138+.
 */

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
}

/**
 * Prompt options for structured output
 */
export interface AILanguageModelPromptOptions {
    /** Signal to abort the prompt */
    signal?: AbortSignal;
    /** JSON Schema or regex to constrain response format */
    responseConstraint?: {
        type: "json-schema";
        schema: object;
    } | {
        type: "regex";
        pattern: string;
    };
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

/**
 * Represents a single AI session created from the platform's AI API (e.g., Gemini Nano).
 * This is a simplified wrapper around AILanguageModelSession for internal use.
 * @deprecated Consider using AILanguageModelSession directly from window.LanguageModel
 */
export interface AISession {
    /**
     * Send a textual prompt to the AI session and receive the response as a string.
     * @param text - The prompt text to send to the AI model.
     * @returns A Promise that resolves to the AI model's string output. This output
     *          may be a plain text reply or a JSON-encoded string depending on the prompt.
     */
    prompt(text: string): Promise<string>;

    /**
     * Optional cleanup method. Call if the underlying AI session requires explicit
     * resource release. Not all environments provide this.
     */
    destroy?(): void;
}

// Type definitions for page content
export interface PageContent {
    /** Page title, typically document.title */
    title: string;
    /** Page URL */
    url: string;
    /** A short content snippet or initial paragraphs suitable for summarization */
    content?: string;
    /** Optional abstract-like summary if extracted by other means */
    abstract?: string;
    /** Full text content extracted from the main page area */
    fullText: string;
    /** meta[name="description"] content, if available */
    metaDescription?: string;
    /** Array of heading texts (h1..h6) found on the page */
    headings?: string[];
    /** Top outbound links found on the page (limited when extracted) */
    links?: string[];
    /** Image URLs extracted from the page */
    images?: string[];
}

// Type definitions for structured data
export interface StructuredData {
    /**
     * A flexible map for extracted key/value pairs. Values are intentionally
     * permissive to allow strings, arrays, numbers, booleans, or nested objects.
     */
    [key: string]: string | string[] | number | boolean | object;
}

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
