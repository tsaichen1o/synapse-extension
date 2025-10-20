import { PageContent, StructuredData, ChatResponse } from '../../types';
import type { AI } from '../ai';

/**
 * Chat service that uses an AI instance
 */
export class ChatService {
    constructor(private ai: AI) { }

    /**
     * Generate a prompt for interactive chat with Gemini
     */
    private buildPrompt(
        pageContent: PageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): string {
        const structuredDataString = JSON.stringify(currentStructuredData, null, 2);

        return `
# Context
This is a web page content analysis tool. You are conversing with a user to help refine the page summary and structured information.

## Original Page Content (for reference, do not repeat the summary):
Title: ${pageContent.title}
Excerpt: ${pageContent.content ||
            pageContent.abstract ||
            pageContent.fullText.substring(0, 1000)
            }

## Current Summary:
${currentSummary}

## Current Structured Information (JSON format):
${structuredDataString}

# User Request
The user wants you to modify the summary or the structured information according to their instructions. After making changes, provide the complete result again in JSON format. If the user is asking a question, respond politely.

# User Message
"${userMessage}"

# Your Task
Based on the user's message, update the summary and structured information. The final response must strictly follow the JSON format below and avoid any additional text output:
{
  "summary": "...",
  "structuredData": {
    "Key1": "Value1",
    "Key2": ["Value2a", "Value2b"],
    "KeyN": "ValueN"
  },
  "aiResponse": "I have updated the information based on your instructions. Please review the revised summary and structured data." // This part is the conversational response shown to the user
}
        `.trim();
    }

    /**
     * Chat with AI to refine summaries and structured data
     */
    async chat(
        pageContent: PageContent,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): Promise<ChatResponse> {
        try {
            const promptText = this.buildPrompt(
                pageContent,
                currentSummary,
                currentStructuredData,
                userMessage
            );

            const result = await this.ai.prompt(promptText);

            try {
                const jsonResult = JSON.parse(result);
                return {
                    summary: jsonResult.summary,
                    structuredData: jsonResult.structuredData,
                    aiResponse: jsonResult.aiResponse || "好的,我已嘗試根據您的指示進行調整。",
                };
            } catch (e) {
                console.error("無法解析 AI 的對話 JSON 回應:", result, e);
                return {
                    summary: currentSummary,
                    structuredData: currentStructuredData,
                    aiResponse: "抱歉,我無法理解您的指令或解析我的回應。請再試一次。",
                };
            }
        } catch (error) {
            console.error("Error in chat:", error);
            return {
                summary: currentSummary,
                structuredData: currentStructuredData,
                aiResponse: `發生錯誤: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
}
