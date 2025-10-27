/**
 * Custom error types for AI processing
 * Provides rich context for error handling and user feedback
 */

export type AIProcessingPhase = 'condense' | 'summarize' | 'chat' | 'image';
export type AIProcessingStep =
    | 'metadata-extraction'
    | 'chunking'
    | 'iterative-processing'
    | 'conversion'
    | 'content-extraction'
    | 'structured-data-extraction'
    | 'summary-generation'
    | 'intent-analysis'
    | 'modification'
    | 'response-generation'
    | 'image-processing';

/**
 * Base error class for AI processing errors
 */
export class AIProcessingError extends Error {
    constructor(
        message: string,
        public phase: AIProcessingPhase,
        public step: AIProcessingStep,
        public recoverable: boolean,
        public userMessage: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'AIProcessingError';

        // Capture stack trace (V8-specific)
        if ('captureStackTrace' in Error && typeof (Error as { captureStackTrace: unknown }).captureStackTrace === 'function') {
            (Error as { captureStackTrace: (target: object, constructorOpt?: unknown) => void }).captureStackTrace(this, AIProcessingError);
        }
    }

    /**
     * Get a user-friendly error message with emoji
     */
    getUserFriendlyMessage(): string {
        const emoji = this.recoverable ? '⚠️' : '❌';
        return `${emoji} ${this.userMessage}`;
    }

    /**
     * Get technical details for logging
     */
    getTechnicalDetails(): string {
        return `[${this.phase}/${this.step}] ${this.message}${this.originalError ? ` (Caused by: ${this.originalError.message})` : ''}`;
    }

    /**
     * Convert to JSON for logging or transmission
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            phase: this.phase,
            step: this.step,
            recoverable: this.recoverable,
            userMessage: this.userMessage,
            stack: this.stack,
            originalError: this.originalError ? {
                message: this.originalError.message,
                stack: this.originalError.stack
            } : undefined
        };
    }
}

/**
 * Error for condense service failures
 */
export class CondenseError extends AIProcessingError {
    constructor(
        step: AIProcessingStep,
        message: string,
        recoverable: boolean,
        userMessage: string,
        originalError?: Error
    ) {
        super(message, 'condense', step, recoverable, userMessage, originalError);
        this.name = 'CondenseError';
    }
}

/**
 * Error for summarize service failures
 */
export class SummarizeError extends AIProcessingError {
    constructor(
        step: AIProcessingStep,
        message: string,
        recoverable: boolean,
        userMessage: string,
        originalError?: Error
    ) {
        super(message, 'summarize', step, recoverable, userMessage, originalError);
        this.name = 'SummarizeError';
    }
}

/**
 * Error for chat service failures
 */
export class ChatError extends AIProcessingError {
    constructor(
        step: AIProcessingStep,
        message: string,
        recoverable: boolean,
        userMessage: string,
        originalError?: Error
    ) {
        super(message, 'chat', step, recoverable, userMessage, originalError);
        this.name = 'ChatError';
    }
}

/**
 * Error for quota/rate limit issues
 */
export class AIQuotaError extends AIProcessingError {
    constructor(
        phase: AIProcessingPhase,
        public usage: number,
        public quota: number
    ) {
        const percentUsed = quota > 0 ? ((usage / quota) * 100).toFixed(1) : '100';
        super(
            `AI quota exceeded: ${usage}/${quota} tokens used (${percentUsed}%)`,
            phase,
            'metadata-extraction', // placeholder
            false, // not recoverable
            `AI quota limit reached. You've used ${percentUsed}% of available tokens. Please try again later or refresh the page.`
        );
        this.name = 'AIQuotaError';
    }
}

/**
 * Error factory functions for common error scenarios
 */
export const AIErrors = {
    /**
     * Content too large error
     */
    contentTooLarge: (contentLength: number): CondenseError => {
        return new CondenseError(
            'chunking',
            `Content too large: ${contentLength} characters`,
            true,
            'The page content is very large. Trying to compress it...',
        );
    },

    /**
     * Extraction failed error
     */
    extractionFailed: (phase: AIProcessingPhase, originalError: Error): AIProcessingError => {
        if (phase === 'condense') {
            return new CondenseError(
                'metadata-extraction',
                'Failed to extract metadata',
                true,
                'Having trouble analyzing the page structure. Using simplified extraction...',
                originalError
            );
        } else if (phase === 'summarize') {
            return new SummarizeError(
                'content-extraction',
                'Failed to extract key themes',
                true,
                'Having trouble identifying main themes. Trying a simpler approach...',
                originalError
            );
        }
        return new AIProcessingError(
            'Extraction failed',
            phase,
            'metadata-extraction',
            true,
            'Having trouble extracting information. Trying a different approach...',
            originalError
        );
    },

    /**
     * Structured data extraction failed
     */
    structuredDataFailed: (originalError: Error): SummarizeError => {
        return new SummarizeError(
            'structured-data-extraction',
            'Failed to extract structured data',
            true,
            'Having trouble extracting detailed information. Trying simplified extraction...',
            originalError
        );
    },

    /**
     * Summary generation failed
     */
    summaryFailed: (originalError: Error): SummarizeError => {
        return new SummarizeError(
            'summary-generation',
            'Failed to generate summary',
            true,
            'Having trouble generating summary. Trying a simpler approach...',
            originalError
        );
    },

    /**
     * Chat intent analysis failed
     */
    intentAnalysisFailed: (originalError: Error): ChatError => {
        return new ChatError(
            'intent-analysis',
            'Failed to analyze user intent',
            true,
            'Having trouble understanding your request. Trying direct processing...',
            originalError
        );
    },

    /**
     * Chat modification failed
     */
    modificationFailed: (originalError: Error): ChatError => {
        return new ChatError(
            'modification',
            'Failed to apply modifications',
            true,
            'Having trouble making the requested changes. Trying a simpler approach...',
            originalError
        );
    },

    /**
     * AI not available error
     */
    aiNotAvailable: (): AIProcessingError => {
        return new AIProcessingError(
            'AI language model is not available on this device',
            'summarize',
            'metadata-extraction',
            false,
            '⚠️ AI is not available. Please check if Chrome Built-in AI is enabled in chrome://flags.'
        );
    },

    /**
     * Session creation failed
     */
    sessionCreationFailed: (originalError: Error): AIProcessingError => {
        return new AIProcessingError(
            'Failed to create AI session',
            'summarize',
            'metadata-extraction',
            false,
            'Failed to initialize AI. Please refresh the page and try again.',
            originalError
        );
    },

    /**
     * Generic unexpected error
     */
    unexpected: (phase: AIProcessingPhase, originalError: Error): AIProcessingError => {
        return new AIProcessingError(
            `Unexpected error in ${phase}`,
            phase,
            'metadata-extraction',
            false,
            `An unexpected error occurred. Please try again. (${originalError.message})`,
            originalError
        );
    }
};

/**
 * Utility function to check if an error is an AI processing error
 */
export function isAIProcessingError(error: unknown): error is AIProcessingError {
    return error instanceof AIProcessingError;
}

/**
 * Utility function to convert any error to AI processing error
 */
export function toAIProcessingError(
    error: unknown,
    phase: AIProcessingPhase,
    step: AIProcessingStep
): AIProcessingError {
    if (isAIProcessingError(error)) {
        return error;
    }

    const originalError = error instanceof Error ? error : new Error(String(error));
    return new AIProcessingError(
        originalError.message,
        phase,
        step,
        true,
        'An error occurred while processing. Trying alternative approach...',
        originalError
    );
}
