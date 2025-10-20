/**
 * Utility functions for cleaning and processing AI model outputs
 */

/**
 * Cleans AI output by removing markdown code block markers and other common artifacts
 * 
 * Handles cases like:
 * - ```json\n{...}\n```
 * - ```\n{...}\n```
 * - Leading/trailing whitespace
 * - Multiple consecutive newlines
 * 
 * @param output - Raw output from AI model
 * @returns Cleaned output string
 */
export function cleanAIOutput(output: string): string {
    let cleaned = output.trim();

    // Remove markdown code block markers with optional language identifier
    // Matches: ```json, ```javascript, ```typescript, etc.
    cleaned = cleaned.replace(/^```[\w]*\s*\n?/g, '');
    cleaned = cleaned.replace(/\n?```\s*$/g, '');

    // Remove any remaining standalone ``` markers
    cleaned = cleaned.replace(/^```|```$/g, '');

    // Trim again after removing markers
    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * Safely parses JSON from AI output, attempting to clean it first if parsing fails
 * 
 * @param output - Raw output from AI model (possibly containing markdown markers)
 * @returns Parsed JSON object
 * @throws Error if JSON parsing fails after cleaning attempts
 */
export function parseAIJSON<T = any>(output: string): T {
    try {
        // Try parsing directly first
        return JSON.parse(output);
    } catch (firstError) {
        // If that fails, try cleaning and parsing again
        try {
            const cleaned = cleanAIOutput(output);
            return JSON.parse(cleaned);
        } catch (secondError) {
            console.error("Failed to parse AI output as JSON:", {
                original: output,
                cleaned: cleanAIOutput(output),
                firstError,
                secondError
            });
            throw new Error("Unable to parse AI response as valid JSON");
        }
    }
}

/**
 * Extracts JSON from text that may contain additional prose or explanations
 * Looks for the first valid JSON object or array in the text
 * 
 * @param text - Text that may contain JSON along with other content
 * @returns Parsed JSON object or null if no valid JSON found
 */
export function extractJSON<T = any>(text: string): T | null {
    const cleaned = cleanAIOutput(text);

    // Try to find JSON object
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        try {
            return JSON.parse(objectMatch[0]);
        } catch (e) {
            // Continue to array check
        }
    }

    // Try to find JSON array
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        try {
            return JSON.parse(arrayMatch[0]);
        } catch (e) {
            // No valid JSON found
        }
    }

    return null;
}
