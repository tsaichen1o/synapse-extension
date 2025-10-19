import type {
    AILanguageModel,
    AIModelAvailability,
} from '../types';
import { getPageContent } from '../helper';
import { summarizeContentWithAI } from './summarize';
import { extractKeyValuePairs } from '../extractor/content-extractor';
import { chatWithAI } from './chat';

/**
 * Check if Chrome Built-in AI (Gemini Nano) is available
 */
export async function isAIAvailable(): Promise<boolean> {
    if (!window.LanguageModel) {
        console.warn("LanguageModel API is not available in this browser");
        return false;
    }

    try {
        const availability = await window.LanguageModel.availability();
        console.log("AI Model availability:", availability);
        return availability === "available" || availability === "downloadable";
    } catch (error) {
        console.error("Error checking AI availability:", error);
        return false;
    }
}

if (!window.LanguageModel) {
    console.warn("⚠️ LanguageModel API not found. Initializing mock for development.");
    console.warn("To use real AI, please:");
    console.warn("1. Use Chrome 138+ or Chrome Canary");
    console.warn("2. Enable chrome://flags/#optimization-guide-on-device-model");
    console.warn("3. Enable chrome://flags/#prompt-api-for-gemini-nano");
    console.warn("4. Ensure your device meets system requirements (22GB free space or 4GB+ VRAM)");

    // Create a basic mock for development
    const mockLanguageModel: AILanguageModel = {
        availability: async () => "available" as AIModelAvailability,
        params: async () => ({
            defaultTemperature: 0.8,
            defaultTopK: 40,
            maxTopK: 128,
        }),
        create: async () => {
            console.log("🧪 Using mock AI session");
            return {
                prompt: async (text: string): Promise<string> => {
                    console.log("Mock prompt called with:", text.substring(0, 100) + "...");
                    // Return a mock JSON response that matches expected format
                    return JSON.stringify({
                        summary: "這是一個模擬的摘要回應。請啟用真實的 Chrome Built-in AI 來獲得實際功能。",
                        structuredData: {
                            note: "Mock data - enable real AI for actual results",
                            timestamp: new Date().toISOString(),
                        },
                        aiResponse: "這是模擬的 AI 回應。"
                    });
                },
                promptStreaming: (text: string) => {
                    const encoder = new TextEncoder();
                    return new ReadableStream({
                        start(controller) {
                            controller.enqueue(encoder.encode("Mock streaming response"));
                            controller.close();
                        }
                    }) as unknown as ReadableStream<string>;
                },
                clone: async function () { return this; },
                destroy: () => { console.log("Mock session destroyed"); },
            };
        },
    };

    window.LanguageModel = mockLanguageModel;
}

// Export the new recommended API
export { AI as GeminiAI } from './ai';

// Export utility functions
export {
    getPageContent,
    summarizeContentWithAI,
    chatWithAI,
    extractKeyValuePairs,
};

