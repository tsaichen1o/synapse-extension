import type {
    AILanguageModelCreateOptions,
    AILanguageModelSession,
    PageContent,
    StructuredData,
    SummaryResponse,
    ChatResponse,
    CondensedPageContent,
    LanguageDetectionRequestOptions,
    LanguageDetectionResult,
    TranslationRequestOptions,
    ContentType,
} from '../types';
import {
    SummarizeService,
    ChatService,
    CondenseService,
    ImageService,
    LanguageDetectorService,
    TranslatorService,
    ContentTypeClassifierService
} from './services';

/**
 * Wrapper class for Chrome Built-in AI (currently Gemini Nano)
 */
export class AI {
    private nativeSession: AILanguageModelSession;

    private readonly summarizeService: SummarizeService;
    private readonly chatService: ChatService;
    private readonly condenseService: CondenseService;
    private readonly imageService: ImageService;
    private readonly languageDetectorService: LanguageDetectorService;
    private readonly translatorService: TranslatorService;
    private readonly contentTypeClassifierService: ContentTypeClassifierService;


    private constructor(session: AILanguageModelSession) {
        this.nativeSession = session;

        this.summarizeService = new SummarizeService(this);
        this.chatService = new ChatService(this);
        this.condenseService = new CondenseService(this);
        this.imageService = new ImageService(this);
        this.languageDetectorService = new LanguageDetectorService();
        this.translatorService = new TranslatorService();
        this.contentTypeClassifierService = new ContentTypeClassifierService(this);
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
                {
                    type: "image", // Support image input for multimodal processing
                },
            ],
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
     * 
     * @param prompt - The prompt text to send to the model
     * @param schema - JSON Schema object to constrain the response format
     * @param omitSchemaFromInput - If true, schema won't count against input quota (recommended)
     */
    async promptStructured<T = unknown>(
        prompt: string,
        schema: object,
        omitSchemaFromInput: boolean = true
    ): Promise<T> {
        const result = await this.nativeSession.prompt(prompt, {
            responseConstraint: schema,
            omitResponseConstraintInput: omitSchemaFromInput,
        });

        return JSON.parse(result) as T;
    }

    /**
     * Get current resource usage information.
     * TODO: Show usage in the UI for information.
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
     * Clone this instance to reset context while keeping initial configuration
     */
    async clone(): Promise<AI> {
        const clonedSession = await this.nativeSession.clone();
        return new AI(clonedSession);
    }

    /**
     * Reset the current session by cloning it
     * This clears conversation history while keeping the initial configuration
     */
    async reset(): Promise<void> {
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
        this.languageDetectorService.reset();
        this.translatorService.reset();
    }

    /**
     * Get the underlying native session for advanced use cases
     */
    getNativeSession(): AILanguageModelSession {
        return this.nativeSession;
    }

    /**
     * Append images from PageContent to the session as context
     * This should be called after condense() to provide visual context
     * Delegates to ImageService
     */
    async appendImageContext(pageContent: PageContent): Promise<void> {
        return this.imageService.appendImageContext(pageContent);
    }

    /**
     * Set progress callback for condense operation
     * This allows UI to show real-time progress during chunk processing
     */
    setCondenseProgressCallback(callback: (current: number, total: number) => void): void {
        this.condenseService.setProgressCallback(callback);
    }

    /**
     * Set progress callback for summarize operation
     * This allows UI to show real-time progress during summarization steps
     */
    setSummarizeProgressCallback(callback: (current: number, total: number) => void): void {
        this.summarizeService.setProgressCallback(callback);
    }

    /**
     * Condense page content to avoid token limits
     * Delegates to CondenseService
     * 
     * This is the first required step in the AI processing pipeline.
     * The output must be passed to summarize() and chat() methods.
     */
    async condense(pageContent: PageContent): Promise<CondensedPageContent> {
        return this.condenseService.condensePageContent(pageContent);
    }

    /**
     * Summarize condensed page content using AI
     * Accepts only CondensedPageContent - you must call condense() first
     * Delegates to SummarizeService
     */
    async summarize(input: CondensedPageContent): Promise<SummaryResponse> {
        return this.summarizeService.summarize(input);
    }

    /**
     * Chat with AI to refine summaries and structured data
     * Accepts only CondensedPageContent - you must call condense() first
     * Delegates to ChatService
     */
    async chat(
        input: CondensedPageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        return this.chatService.chat(input, currentSummary, currentStructuredData, userMessage);
    }

    /**
     * Detect likely languages for a piece of text using the on-device language detector.
     */
    async detectLanguage(
        text: string,
        options?: LanguageDetectionRequestOptions
    ): Promise<LanguageDetectionResult[]> {
        return this.languageDetectorService.detect(text, options);
    }

    /**
     * Translate text using the on-device translator for the given language pair.
     */
    async translate(text: string, options: TranslationRequestOptions): Promise<string> {
        return this.translatorService.translate(text, options);
    }

    /**
     * Translate text using streaming output, forwarding chunks to the provided callback.
     */
    async translateStreaming(
        text: string,
        options: TranslationRequestOptions,
        onChunk?: (chunk: string) => void
    ): Promise<string> {
        return this.translatorService.translateStreaming(text, options, onChunk);
    }

    /**
     * Classify content type using AI analysis
     * This intelligently determines the best template for the content
     * Falls back to extractor hint on error
     * Delegates to ContentTypeClassifierService
     */
    async classifyContentType(pageContent: PageContent): Promise<ContentType> {
        return this.contentTypeClassifierService.classify(pageContent);
    }
}
