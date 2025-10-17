/**
 * Represents a single AI session created from the platform's AI API (e.g., Gemini Nano).
 * Implementations should be able to accept a text prompt and return a string response.
 * destroy is optional and can be provided to clean up session resources if supported.
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
