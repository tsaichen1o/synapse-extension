/**
 * Global type definitions for Synapse Extension
 * 
 * This file extends the global Window interface for:
 * - Chrome Built-in AI (Gemini Nano) Prompt API
 * - Development utilities for database management
 * 
 * All concrete type definitions are in `./types.ts`.
 * @see https://developer.chrome.com/docs/ai/built-in
 */

import type { AILanguageModel, LanguageDetector, Translator } from './types';

declare global {
    interface Window {
        /**
         * Chrome Built-in AI Language Model (Gemini Nano)
         * Available in Chrome 138+ with appropriate flags/origin trial
         */
        LanguageModel?: AILanguageModel;

        /**
         * Chrome Built-in AI Language Detector API
         */
        LanguageDetector?: LanguageDetector;

        /**
         * Chrome Built-in On-Device Translator API
         */
        Translator?: Translator;

        /**
         * Development utility: Clear all data from Synapse IndexedDB
         * Only available in development mode
         */
        clearSynapseDB?: () => void;

        /**
         * Development utility: Add mock data to Synapse IndexedDB
         * Only available in development mode
         */
        addMockData?: () => Promise<void>;
    }
}
