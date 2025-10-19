/**
 * Type definitions for Chrome Built-in AI (Gemini Nano) Prompt API.
 * This file extends the global Window interface.
 * All concrete type definitions are in `./types.ts`.
 * @see https://developer.chrome.com/docs/ai/built-in
 */

import type { AILanguageModel } from './types';

declare global {
    interface Window {
        /**
         * Chrome Built-in AI Language Model (Gemini Nano)
         * Available in Chrome 138+ with appropriate flags/origin trial
         */
        LanguageModel?: AILanguageModel;
    }
}
