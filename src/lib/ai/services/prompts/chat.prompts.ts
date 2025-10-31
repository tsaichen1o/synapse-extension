import type { StructuredData } from '../../../types';

/**
 * Prompt templates for ChatService
 */
export class ChatPrompts {
    /**
     * Single-pass chat that handles all interactions in one comprehensive AI call
     * 
     * This prompt enables the AI to:
     * - Understand user intent implicitly
     * - Decide whether to modify summary/structured data or just answer questions
     * - Provide a conversational response
     * - All in one go for better UX and performance
     */
    static singlePassChat(
        condensedContent: string,
        currentSummary: string,
        currentStructuredData: StructuredData,
        userMessage: string
    ): string {
        return `
# Intelligent Chat Assistant for Content Refinement

You are helping a user refine their saved web content. The user has a summary and structured data extracted from a webpage, and they want to interact with it through chat.

## Current Summary:
${currentSummary}

## Current Structured Data:
${JSON.stringify(currentStructuredData, null, 2)}

## Condensed Page Content (for reference):
${condensedContent}

## User Message:
"${userMessage}"

# Your Task

Analyze the user's message and respond appropriately:

**If the user is asking a question:**
- Answer based on the summary, structured data, and condensed content
- Keep modifiedSummary and modifiedStructuredData the same as current
- Set summaryModified and structuredDataModified to false
- Provide a helpful answer in aiResponse

**If the user wants to modify the summary or structured data:**
- Make the requested changes (add, remove, update, shorten, expand, etc.)
- Update modifiedSummary and/or modifiedStructuredData accordingly
- Set summaryModified and/or structuredDataModified to true as appropriate
- Explain what you changed in aiResponse

**Guidelines:**
- Be precise and only change what the user requested
- Use the condensed content as reference when adding new information
- Keep the tone conversational and friendly
- If unclear, make your best interpretation and mention it in the response
- Maintain the structure and format of existing data

**Output Format:**
Return a JSON object with:
- modifiedSummary: string (the summary, modified if requested, otherwise unchanged)
- modifiedStructuredData: object (the structured data, modified if requested, otherwise unchanged)
- aiResponse: string (conversational response to the user, 2-3 sentences)

**Examples:**

Example 1 - Simple Question:
User: "What is this about?"
Current Summary: "This comprehensive article explores the application of machine learning algorithms in modern healthcare systems..."
Current Structured Data: {"title": "ML in Healthcare", "author": "Dr. Smith"}
Output:
{
  "modifiedSummary": "This comprehensive article explores the application of machine learning algorithms in modern healthcare systems...",
  "modifiedStructuredData": {"title": "ML in Healthcare", "author": "Dr. Smith"},
  "aiResponse": "This article discusses machine learning applications in healthcare, focusing on how AI algorithms can improve diagnostic accuracy and patient outcomes."
}

Example 2 - Modify Summary:
User: "Make the summary shorter"
Current Summary: "This comprehensive article explores the application of machine learning algorithms in modern healthcare systems, discussing various implementation strategies, challenges, and future opportunities in the field."
Current Structured Data: {"title": "ML in Healthcare", "author": "Dr. Smith"}
Output:
{
  "modifiedSummary": "This article explores machine learning applications in healthcare, covering implementation strategies and future opportunities.",
  "modifiedStructuredData": {"title": "ML in Healthcare", "author": "Dr. Smith"},
  "aiResponse": "I've shortened the summary to focus on the key points while keeping the essential information."
}

Example 3 - Add Structured Data:
User: "Add the publication date: March 2024"
Current Summary: "This article explores machine learning in healthcare..."
Current Structured Data: {"title": "ML in Healthcare", "author": "Dr. Smith"}
Output:
{
  "modifiedSummary": "This article explores machine learning in healthcare...",
  "modifiedStructuredData": {
    "title": "ML in Healthcare",
    "author": "Dr. Smith",
    "publicationDate": "March 2024"
  },
  "aiResponse": "I've added the publication date (March 2024) to the structured data."
}

Example 4 - Question + Modification:
User: "What's the main argument and also add it to the structured data"
Current Summary: "This article argues that AI can significantly improve diagnostic accuracy..."
Current Structured Data: {"title": "ML in Healthcare", "author": "Dr. Smith"}
Output:
{
  "modifiedSummary": "This article argues that AI can significantly improve diagnostic accuracy...",
  "modifiedStructuredData": {
    "title": "ML in Healthcare",
    "author": "Dr. Smith",
    "mainArgument": "AI can significantly improve diagnostic accuracy in medical imaging"
  },
  "aiResponse": "The main argument is that AI can significantly improve diagnostic accuracy in medical imaging. I've added this to the structured data for you."
}
        `.trim();
    }
}
