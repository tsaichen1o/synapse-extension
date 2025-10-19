/// <reference path="../global.d.ts" />

import {
    AILanguageModelSession,
    AILanguageModelCreateOptions,
    AIModelAvailability,
} from '../types';

/**
 * Advanced session management utilities for Chrome Built-in AI (Gemini Nano)
 * Provides helpers for streaming responses, structured output, and session lifecycle management.
 */

/**
 * Create an AI session with custom parameters and initial context
 */
export async function createAdvancedSession(options?: {
    temperature?: number;
    topK?: number;
    systemPrompt?: string;
}): Promise<AILanguageModelSession> {
    if (!window.LanguageModel) {
        throw new Error("LanguageModel API is not available");
    }

    const params = await window.LanguageModel.params();

    const createOptions: AILanguageModelCreateOptions = {
        temperature: options?.temperature ?? params.defaultTemperature,
        topK: options?.topK ?? params.defaultTopK,
    };

    // Add system prompt if provided
    if (options?.systemPrompt) {
        createOptions.initialPrompts = [
            {
                role: "system",
                content: options.systemPrompt,
            },
        ];
    }

    return await window.LanguageModel.create(createOptions);
}

/**
 * Get a streaming response from the AI with a callback for each chunk
 */
export async function promptWithStreaming(
    session: AILanguageModelSession,
    prompt: string,
    onChunk: (chunk: string) => void
): Promise<string> {
    const stream = session.promptStreaming(prompt);
    const reader = stream.getReader();
    let fullResponse = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullResponse += value;
            onChunk(value);
        }
    } finally {
        reader.releaseLock();
    }

    return fullResponse;
}

/**
 * Get structured JSON output from the AI using JSON Schema constraint
 */
export async function promptWithStructuredOutput<T = any>(
    session: AILanguageModelSession,
    prompt: string,
    schema: object
): Promise<T> {
    const result = await session.prompt(prompt, {
        responseConstraint: {
            type: "json-schema",
            schema: schema,
        },
    });

    return JSON.parse(result) as T;
}

/**
 * Check session resource usage
 */
export function checkSessionUsage(session: AILanguageModelSession): {
    usage: number;
    quota: number;
    percentUsed: number;
} {
    const usage = session.inputUsage ?? 0;
    const quota = session.inputQuota ?? 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentUsed };
}

/**
 * Clone a session to reset context while keeping initial prompts
 */
export async function resetSessionContext(
    session: AILanguageModelSession
): Promise<AILanguageModelSession> {
    return await session.clone();
}

/**
 * Session pool manager to reuse sessions efficiently
 */
export class AISessionPool {
    private sessions: AILanguageModelSession[] = [];
    private readonly maxSessions: number;

    constructor(maxSessions: number = 3) {
        this.maxSessions = maxSessions;
    }

    async getSession(options?: {
        temperature?: number;
        topK?: number;
        systemPrompt?: string;
    }): Promise<AILanguageModelSession> {
        // Reuse existing session if available
        if (this.sessions.length > 0) {
            const session = this.sessions.pop()!;
            // Check if session is still usable
            const { percentUsed } = checkSessionUsage(session);
            if (percentUsed < 80) {
                return session;
            } else {
                session.destroy();
            }
        }

        // Create new session
        return await createAdvancedSession(options);
    }

    releaseSession(session: AILanguageModelSession): void {
        if (this.sessions.length < this.maxSessions) {
            this.sessions.push(session);
        } else {
            session.destroy();
        }
    }

    destroyAll(): void {
        for (const session of this.sessions) {
            session.destroy();
        }
        this.sessions = [];
    }
}

/**
 * Download progress monitor for AI model
 */
export async function waitForModelReady(
    onProgress?: (status: AIModelAvailability) => void,
    maxWaitMs: number = 60000
): Promise<boolean> {
    if (!window.LanguageModel) {
        return false;
    }

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        const availability = await window.LanguageModel.availability();

        if (onProgress) {
            onProgress(availability);
        }

        if (availability === "available") {
            return true;
        }

        if (availability === "unavailable") {
            return false;
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return false;
}
