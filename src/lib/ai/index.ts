import { AISession } from '../types';
import { getPageContent } from '../helper';
import { summarizeContentWithAI } from './summarize';
import { extractKeyValuePairs } from '../extractor/content-extractor';
import { chatWithAI } from './chat';

// Mock window.ai for testing/fallback
if (!window.ai) {
    // Provide a lightweight mock for local development or environments without
    // the platform AI available. This keeps the rest of the code path testable
    // and avoids crashing when window.ai is undefined in browsers that don't
    // expose the integrated AI features.
    console.log("Initializing mock window.ai for development/testing");
    window.ai = {
        canCreateGenericSession: async (): Promise<boolean> => {
            return true;
        },
        createGenericSession: async (): Promise<AISession> => {
            return {
                prompt: async (text: string): Promise<string> => {
                    return "TODO: Implement mock response logic here.";
                }
            };
        }
    };
}

export {
    getPageContent,
    summarizeContentWithAI,
    chatWithAI,
    extractKeyValuePairs,
};

