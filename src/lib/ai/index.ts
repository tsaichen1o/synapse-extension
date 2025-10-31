export { AI } from "./ai";
export { CaptureOrchestrator } from "./capture-orchestrator";
export type { CaptureResult, CaptureProgressCallbacks } from "./capture-orchestrator";

/**
 * Check if Chrome Built-in AI is available.
 */
export async function isAIAvailable(): Promise<boolean> {
    if (!window.LanguageModel) {
        return false;
    }

    try {
        const availability = await window.LanguageModel.availability();
        return availability === "available" || availability === "downloadable";
    } catch (error) {
        console.error("Error checking AI availability:", error);
        return false;
    }
}
