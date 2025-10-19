/**
 * Type definitions for Chrome Built-in AI (Gemini Nano) Prompt API.
 * Based on the experimental Prompt API available in Chrome 138+.
 * @see https://developer.chrome.com/docs/ai/built-in
 */

/**
 * Availability status of the language model
 */
declare type AIModelAvailability = "unavailable" | "downloadable" | "downloading" | "available";

/**
 * Session configuration options for creating a language model session
 */
declare interface AILanguageModelCreateOptions {
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
declare interface AILanguageModelPromptOptions {
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
declare interface AILanguageModelSession {
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
declare interface AILanguageModel {
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

declare global {
    interface Window {
        /**
         * Chrome Built-in AI Language Model (Gemini Nano)
         * Available in Chrome 138+ with appropriate flags/origin trial
         */
        LanguageModel?: AILanguageModel;

        /**
         * Legacy/deprecated AI API (kept for backward compatibility during migration)
         * @deprecated Use window.LanguageModel instead
         */
        ai?: {
            canCreateGenericSession?: () => Promise<boolean>;
            createGenericSession(): Promise<{
                prompt(text: string): Promise<string>;
                destroy?(): void;
            }>;
        };
    }
}

// Make this file a module to ensure ambient declarations work
export { };