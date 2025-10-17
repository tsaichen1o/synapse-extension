import { PageContent, StructuredData } from '../types';
import { chatWithAI } from '../ai';

/**
 * Extract key-value pairs from content using AI
 */
export async function extractKeyValuePairs(
    content: string,
    prompt: string = "Extract key-value pairs from this content:"
): Promise<Record<string, any>> {
    try {
        const fullPrompt = `${prompt}\n\nContent: ${content}\n\nPlease extract relevant key-value pairs and return them as a JSON object.`;

        // Create a simple page content object for the chat function
        const simplePageContent: PageContent = {
            title: "Content Analysis",
            url: "",
            fullText: content,
            content: content.substring(0, 1000)
        };

        const result = await chatWithAI(simplePageContent, "", {}, fullPrompt);

        // Try to parse JSON from the response
        try {
            const jsonMatch = result.aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.log(
                "Could not parse JSON from AI response, returning structured format"
            );
        }

        // Fallback: return the response in a structured format
        return {
            extracted_data: result.aiResponse,
            extraction_method: "text_analysis",
        };
    } catch (error) {
        console.error("Error extracting key-value pairs:", error);
        return {
            error: "Failed to extract key-value pairs",
            details: error instanceof Error ? error.message : String(error),
        };
    }
}