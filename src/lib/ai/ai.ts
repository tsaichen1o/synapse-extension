import type {
    AILanguageModelCreateOptions,
    AILanguageModelPromptOptions,
    AILanguageModelSession,
    PageContent,
    StructuredData,
    SummaryResponse,
    ChatResponse,
} from '../types';
import { SummarizeService, ChatService } from './services';

/**
 * GeminiAI - A wrapper class for Chrome Built-in AI (Gemini Nano)
 * Provides convenient methods for interacting with the on-device AI model
 */
export class AI {
    private nativeSession: AILanguageModelSession;

    // Services for different AI functionalities
    public readonly summarizeService: SummarizeService;
    public readonly chatService: ChatService;

    private constructor(session: AILanguageModelSession) {
        this.nativeSession = session;

        // Initialize services
        this.summarizeService = new SummarizeService(this);
        this.chatService = new ChatService(this);
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
            expectedOutputs: [
                {
                    type: "text",
                    languages: ["en"],
                },
            ],
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

        const session = await window.LanguageModel.create(createOptions);
        return new AI(session);
    }

    /**
     * Send a prompt and get the complete response
     */
    async prompt(text: string): Promise < string > {
            return await this.nativeSession.prompt(text);
        }

    /**
     * Send a prompt and get a streaming response
     */
    async promptStreaming(
            prompt: string,
            onChunk: (chunk: string) => void
    ): Promise < string > {
            const stream = this.nativeSession.promptStreaming(prompt);
            const reader = stream.getReader();
            let fullResponse = "";

            try {
                while(true) {
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
    async promptStructured < T = any > (
            prompt: string,
                schema: object
    ): Promise < T > {
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
    async clone(): Promise < AI > {
            const clonedSession = await this.nativeSession.clone();
            return new AI(clonedSession);
        }

    /**
     * Reset the current session by cloning it
     * This clears conversation history while keeping the initial configuration
     */
    async reset(): Promise < void> {
            const oldSession = this.nativeSession;
            const clonedSession = await this.nativeSession.clone();
            this.nativeSession = clonedSession;
            oldSession.destroy();
            console.log("AI session has been reset (conversation history cleared)");
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
     * Delegates to SummarizeService
     */
    async summarize(pageContent: PageContent): Promise < SummaryResponse > {
            this.reset();
            return this.summarizeService.summarize(pageContent);
        }

    /**
     * Chat with AI to refine summaries and structured data
     * Delegates to ChatService
     */
    async chat(
            pageContent: PageContent,
            currentSummary: string,
            currentStructuredData: StructuredData,
            userMessage: string
        ): Promise < ChatResponse > {
            return this.chatService.chat(pageContent, currentSummary, currentStructuredData, userMessage);
        }
    }
