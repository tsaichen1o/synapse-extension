import { PageContent, StructuredData } from '../../types';

/**
 * Generate a prompt for page content summarization
 */
export function getSummarizationPrompt(pageContent: PageContent): string {
  return `
    # Web Page Content Analysis Task

    ## Page Information:
    Title: ${pageContent.title}
    URL: ${pageContent.url}
    Description: ${pageContent.metaDescription || "None"}

    ## Main Content:
    ${pageContent.content || pageContent.abstract || pageContent.fullText.substring(0, 2000)}

    ## Heading Structure:
    ${pageContent.headings?.slice(0, 10).join(', ') || "None"}

    # Task Requirements
    Please analyze the above web page content and provide:
    1. A concise summary in English (150-300 words)
    2. Extracted structured key information

    Return the results in the following JSON format, ensuring the summary is in the "summary" field and structured information is in the "structuredData" field:
    {
      "summary": "...",
      "structuredData": {
        "Key1": "Value1",
        "Key2": ["Value2a", "Value2b"],
        "KeyN": "ValueN"
      }
    }
  `;
}
