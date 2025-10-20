import type {
    AILanguageModelCreateOptions,
    AILanguageModelPromptOptions,
    AILanguageModelSession,
    PageContent,
    StructuredData,
    SummaryResponse,
    ChatResponse,
} from '../types';
import { getSummarizationPrompt } from './prompt/summarization';
import { getChatPrompt } from './prompt/chat';

/**
 * GeminiAI - A wrapper class for Chrome Built-in AI (Gemini Nano)
 * Provides convenient methods for interacting with the on-device AI model
 */
export class AI {
    private nativeSession: AILanguageModelSession;

    private constructor(session: AILanguageModelSession) {
        this.nativeSession = session;
    }

    /**
     * Create a new GeminiAI instance with custom parameters
     */
    static async create(options?: {
        temperature?: number;
        topK?: number;
        systemPrompt?: string;
    }): Promise<AI> {
        if (!window.LanguageModel) {
            throw new Error("LanguageModel API is not available");
        }

        const params = await window.LanguageModel.params();

        const createOptions: AILanguageModelCreateOptions = {
            temperature: options?.temperature ?? params.defaultTemperature,
            topK: options?.topK ?? params.defaultTopK,
            expectedInputs: [
                {
                    type: "text",
                    languages: ["en"],
                },
            ],
            expectedOutputs: [
                {
                    type: "text",
                    languages: ["en"],
                },
            ],
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    // @ts-ignore
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            },
        };

        console.log("Creating AI session with options:", createOptions);
        // Add system prompt if provided
        if (options?.systemPrompt) {
            createOptions.initialPrompts = [
                {
                    role: "system",
                    content: options.systemPrompt,
                },
            ];
        }

        const session = await window.LanguageModel.create(createOptions);
        return new AI(session);
    }

    /**
     * Send a prompt and get the complete response
     */
    async prompt(text: string): Promise<string> {
        return await this.nativeSession.prompt(text);
    }

    /**
     * Send a prompt and get a streaming response
     */
    async promptStreaming(
        prompt: string,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const stream = this.nativeSession.promptStreaming(prompt);
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
     * Send a prompt and get structured JSON output using JSON Schema
     */
    async promptStructured<T = any>(
        prompt: string,
        schema: object
    ): Promise<T> {
        const result = await this.nativeSession.prompt(prompt, {
            responseConstraint: {
                type: "json-schema",
                schema: schema,
            },
        });

        return JSON.parse(result) as T;
    }

    /**
     * Get current resource usage information
     */
    getUsage(): {
        usage: number;
        quota: number;
        percentUsed: number;
    } {
        const usage = this.nativeSession.inputUsage ?? 0;
        const quota = this.nativeSession.inputQuota ?? 0;
        const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

        return { usage, quota, percentUsed };
    }

    /**
     * Check if resource usage is above a threshold
     */
    isUsageHigh(threshold: number = 80): boolean {
        return this.getUsage().percentUsed >= threshold;
    }

    /**
     * Clone this instance to reset context while keeping initial configuration
     */
    async clone(): Promise<AI> {
        const clonedSession = await this.nativeSession.clone();
        return new AI(clonedSession);
    }

    /**
     * Release resources used by this instance
     */
    destroy(): void {
        this.nativeSession.destroy();
    }

    /**
     * Get the underlying native session for advanced use cases
     */
    getNativeSession(): AILanguageModelSession {
        return this.nativeSession;
    }

    /**
     * Summarize page content using AI
     */
    async summarize(pageContent: PageContent): Promise<SummaryResponse> {
        try {
            const promptText = getSummarizationPrompt(pageContent);
            const result = await this.prompt(promptText);

            try {
                const jsonResult: SummaryResponse = JSON.parse(result);
                return {
                    summary: jsonResult.summary,
                    structuredData: jsonResult.structuredData,
                };
            } catch (e) {
                console.error("Unable to parse JSON response from AI:", result, e);
                // Return the raw response as summary if JSON parsing fails
                return {
                    summary: result,
                    structuredData: {},
                };
            }
        } catch (error) {
            console.error("Error in summarize:", error);
            throw new Error(`Failed to summarize content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Chat with AI to refine summaries and structured data
     */
    async chat(
        pageContent: PageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            const promptText = getChatPrompt(
                pageContent,
                currentSummary,
                currentStructuredData,
                userMessage
            );

            const result = await this.prompt(promptText);

            try {
                const jsonResult = JSON.parse(result);
                return {
                    summary: jsonResult.summary,
                    structuredData: jsonResult.structuredData,
                    aiResponse: jsonResult.aiResponse || "好的,我已嘗試根據您的指示進行調整。",
                };
            } catch (e) {
                console.error("無法解析 AI 的對話 JSON 回應:", result, e);
                return {
                    summary: currentSummary,
                    structuredData: currentStructuredData,
                    aiResponse: "抱歉,我無法理解您的指令或解析我的回應。請再試一次。",
                };
            }
        } catch (error) {
            console.error("Error in chat:", error);
            return {
                summary: currentSummary,
                structuredData: currentStructuredData,
                aiResponse: `發生錯誤: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
}
