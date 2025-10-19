/// <reference path="../global.d.ts" />

import {
    AISession,
    AILanguageModel,
    AIModelAvailability,
    AILanguageModelSession
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

/**
 * Create an AI session using the Chrome Built-in AI (Gemini Nano)
 * This function handles model downloading if necessary (requires user interaction)
 */
export async function createAISession(): Promise<AISession> {
    if (!window.LanguageModel) {
        throw new Error("LanguageModel API is not available. Please use Chrome 138+ with Built-in AI enabled.");
    }

    const availability = await window.LanguageModel.availability();

    if (availability === "unavailable") {
        throw new Error("AI model is unavailable on this device. Please check system requirements.");
    }

    if (availability === "downloadable") {
        console.log("AI model needs to be downloaded. This requires user interaction.");
        // TODO: In a real extension, you should trigger this from a user action (button click)
        // The create() call will fail if not triggered by user interaction
    }

    if (availability === "downloading") {
        console.log("AI model is currently downloading. Please wait...");
        // TODO: You might want to poll or wait here in a production app
    }

    try {
        const session = await window.LanguageModel.create({
            temperature: 0.7,  // Balanced creativity
            topK: 40,          // Good diversity
        });

        console.log("AI session created successfully");

        // Wrap the native session to match our AISession interface
        return {
            prompt: async (text: string): Promise<string> => {
                return await session.prompt(text);
            },
            destroy: () => {
                session.destroy();
            }
        };
    } catch (error) {
        console.error("Failed to create AI session:", error);
        throw new Error(`Failed to create AI session: ${error instanceof Error ? error.message : String(error)}`);
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

export {
    getPageContent,
    summarizeContentWithAI,
    chatWithAI,
    extractKeyValuePairs,
};

