import { AISession } from './types';


/**
 * Minimal shape of the platform-provided AI API exposed on window.ai.
 * The Chrome/Edge/Chromium AI integration may provide these helpers. We guard
 * against their absence and provide a mock implementation for development.
 */
interface WindowAI {
    /**
     * Optional helper to check whether a generic session can be created in the current environment.
     * When present, returns a Promise resolving to true if sessions are supported.
     */
    canCreateGenericSession?: () => Promise<boolean>;

    /**
     * Create a new AI session instance. The returned session should implement AISession.
     * @returns A Promise that resolves to an AISession for sending prompts.
     */
    createGenericSession(): Promise<AISession>;
}


declare global {
    interface Window {
        /**
         * Optional platform AI API surface. May be undefined in browsers that
         * don't provide the integrated AI feature; code should check before use.
         */
        ai?: WindowAI;
    }
}