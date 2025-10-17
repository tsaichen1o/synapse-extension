// Type definitions for Chrome AI and extension APIs

/**
 * Represents a single AI session created from the platform's AI API (e.g., Gemini Nano).
 * Implementations should be able to accept a text prompt and return a string response.
 * destroy is optional and can be provided to clean up session resources if supported.
 */
interface AISession {
    /**
     * Send a textual prompt to the AI session and receive the response as a string.
     * @param text - The prompt text to send to the AI model.
     * @returns A Promise that resolves to the AI model's string output. This output
     *          may be a plain text reply or a JSON-encoded string depending on the prompt.
     */
    prompt(text: string): Promise<string>;

    /**
     * Optional cleanup method. Call if the underlying AI session requires explicit
     * resource release. Not all environments provide this.
     */
    destroy?(): void;
}

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

// Type definitions for page content
export interface PageContent {
    /** Page title, typically document.title */
    title: string;
    /** Page URL */
    url: string;
    /** A short content snippet or initial paragraphs suitable for summarization */
    content?: string;
    /** Optional abstract-like summary if extracted by other means */
    abstract?: string;
    /** Full text content extracted from the main page area */
    fullText: string;
    /** meta[name="description"] content, if available */
    metaDescription?: string;
    /** Array of heading texts (h1..h6) found on the page */
    headings?: string[];
    /** Top outbound links found on the page (limited when extracted) */
    links?: string[];
    /** Image URLs extracted from the page */
    images?: string[];
}

// Type definitions for structured data
export interface StructuredData {
    /**
     * A flexible map for extracted key/value pairs. Values are intentionally
     * permissive to allow strings, arrays, numbers, booleans, or nested objects.
     */
    [key: string]: string | string[] | number | boolean | object;
}

// Type definitions for AI responses
export interface SummaryResponse {
    /** Human-readable summary text (usually Chinese for this project) */
    summary: string;
    /** Structured key/value pairs extracted from the page */
    structuredData: StructuredData;
}

export interface ChatResponse extends SummaryResponse {
    /** A user-facing conversational response from the AI in addition to the structured data */
    aiResponse: string;
}

// Type for Chrome tabs
interface ChromeTab {
    id?: number;
    url?: string;
    title?: string;
    active?: boolean;
    windowId?: number;
}

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
                    // Log a truncated preview to avoid spamming long prompts
                    console.log("Mock AI received prompt:", text.substring(0, 100) + "...");

                    // Simple mock behavior: if the prompt asks for JSON-like output,
                    // return a JSON string following the expected SummaryResponse shape.
                    if (text.includes("JSON")) {
                        return JSON.stringify({
                            summary: "這是一個模擬的網頁內容摘要。由於 Gemini Nano 不可用，這是模擬回應。",
                            structuredData: {
                                "主要話題": "模擬內容",
                                "關鍵字": ["模擬", "測試", "開發"],
                                "狀態": "開發中"
                            }
                        });
                    }

                    // Default fallback reply when not requesting structured JSON
                    return "這是一個模擬的 AI 回應，因為 Gemini Nano 當前不可用。";
                }
            };
        }
    };
}

/**
 * Extracts page content from the currently active tab by injecting a DOM
 * extraction script and returning a normalized PageContent object.
 *
 * Errors:
 * - Rejects if there is no active tab
 * - Rejects if script injection fails (chrome.runtime.lastError)
 */
export async function getPageContent(): Promise<PageContent> {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: ChromeTab[]) => {
            const tab = tabs[0];
            if (!tab?.id) {
                reject(new Error("No active tab found"));
                return;
            }

            // 注入內容腳本來提取頁面內容
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: extractPageContentFromDOM,
                },
                (results: chrome.scripting.InjectionResult[]) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (results && results[0] && results[0].result) {
                        const content = results[0].result as PageContent;
                        content.url = tab.url || "";
                        content.title = content.title || tab.title || "";
                        resolve(content);
                    } else {
                        reject(new Error("Failed to extract page content"));
                    }
                }
            );
        });
    });
}

/**
 * This function runs in page context (injected via chrome.scripting.executeScript)
 * and extracts useful pieces of content from the DOM. It returns a PageContent
 * object that will be serialized and sent back to the extension background.
 *
 * Note: This function must only rely on browser globals and DOM APIs since it
 * executes inside the target page (not the extension's context).
 */
function extractPageContentFromDOM(): PageContent {
    const title = document.title;
    const metaDescription = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || "";

    // Extract headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent?.trim())
        .filter((text): text is string => Boolean(text));

    // Extract links
    const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href.startsWith('http'));

    // Extract images
    const images = Array.from(document.querySelectorAll('img[src]'))
        .map(img => (img as HTMLImageElement).src)
        .filter(src => src.startsWith('http'));

    // Extract main content
    let content = "";
    let fullText = "";

    // Try to find main content areas
    const mainContent = document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('.content') ||
        document.querySelector('#content') ||
        document.body;

    if (mainContent) {
        fullText = mainContent.textContent?.trim() || "";

        // Extract first few paragraphs as content summary
        const paragraphs = Array.from(mainContent.querySelectorAll('p'))
            .map(p => p.textContent?.trim())
            .filter((text): text is string => Boolean(text) && text.length > 50)
            .slice(0, 3);

        content = paragraphs.join('\n\n');
    }

    if (!fullText) {
        fullText = document.body.textContent?.trim() || "";
    }

    return {
        title,
        url: window.location.href,
        content,
        fullText,
        metaDescription,
        headings,
        links: links.slice(0, 10), // Limit to first 10 links
        images: images.slice(0, 5)  // Limit to first 5 images
    };
}

/**
 * Use Gemini Nano to summarize and extract structured data from page content
 */
export async function summarizeAndExtract(pageContent: PageContent): Promise<SummaryResponse> {
    if (!window.ai || !window.ai.canCreateGenericSession) {
        // Caller should check availability if they need offline-safe behavior.
        throw new Error("Gemini Nano (window.ai) is not available.");
    }

    // Create an AI session for the summarization task
    const session = await window.ai.createGenericSession();
    const promptText = `
    # 網頁內容分析任務

    ## 網頁資訊：
    標題: ${pageContent.title}
    網址: ${pageContent.url}
    描述: ${pageContent.metaDescription || "無"}

    ## 主要內容：
    ${pageContent.content || pageContent.abstract || pageContent.fullText.substring(0, 2000)}

    ## 標題結構：
    ${pageContent.headings?.slice(0, 10).join(', ') || "無"}

    # 任務要求
    請分析以上網頁內容，提供：
    1. 一個簡潔的中文摘要（150-300字）
    2. 結構化的關鍵資訊提取

    請按照以下 JSON 格式回傳，確保摘要在 "summary" 欄位，結構化資訊在 "structuredData" 欄位：
    {
      "summary": "...",
      "structuredData": {
        "Key1": "Value1",
        "Key2": ["Value2a", "Value2b"],
        "KeyN": "ValueN"
      }
    }
  `;

    // The AI may return a JSON-encoded string or plain text. We try to parse
    // the result as JSON first; on failure we return the raw text as the summary
    // and include a Parse Error in the structuredData to make diagnostics easier.
    const result = await session.prompt(promptText);
    try {
        const jsonResult = JSON.parse(result);
        return {
            summary: jsonResult.summary,
            structuredData: jsonResult.structuredData,
        };
    } catch (e) {
        console.error("無法解析 Gemini Nano 的 JSON 回應:", result, e);
        // Fallback to returning the raw result as the summary so callers still
        // have useful information instead of failing silently.
        return {
            summary: result,
            structuredData: { "Parse Error": "無法解析 AI 回應為 JSON" },
        };
    }
}

/**
 * Interactive chat with Gemini for refining summaries and structured data
 */
export async function chatWithGemini(
    pageContent: PageContent,
    currentSummary: string,
    currentStructuredData: StructuredData,
    userMessage: string
): Promise<ChatResponse> {
    if (!window.ai || !window.ai.canCreateGenericSession) {
        throw new Error("Gemini Nano (window.ai) is not available.");
    }

    // Create a session to handle the interactive chat request
    const session = await window.ai.createGenericSession();
    const structuredDataString = JSON.stringify(currentStructuredData, null, 2);

    const promptText = `
    # Context
    這是一個網頁內容的分析工具，你正在與使用者對話，協助他們精煉對網頁的摘要和結構化資訊。

    ## 原始網頁內容（供參考，不要重複摘要）：
    標題: ${pageContent.title}
    摘要: ${pageContent.content ||
        pageContent.abstract ||
        pageContent.fullText.substring(0, 1000)
        }

    ## 目前的摘要：
    ${currentSummary}

    ## 目前的結構化資訊 (JSON 格式)：
    ${structuredDataString}

    # User Request
    使用者希望你根據他們的指示修改摘要或結構化資訊。請在修改後，再次提供完整的 JSON 格式結果，包含更新後的 "summary" 和 "structuredData"。如果使用者是提問，請禮貌回應。

    # User Message
    "${userMessage}"

    # Your Task
    請根據使用者訊息，更新摘要和結構化資訊。最終回應請務必遵循以下 JSON 格式，並避免任何額外文字輸出：
    {
      "summary": "...",
      "structuredData": {
        "Key1": "Value1",
        "Key2": ["Value2a", "Value2b"],
        "KeyN": "ValueN"
      },
      "aiResponse": "我已根據您的指示調整了資訊。請查看更新後的摘要和結構化數據。" // 這部分是給使用者看的對話回應
    }
  `;

    const result = await session.prompt(promptText);
    try {
        const jsonResult = JSON.parse(result);
        return {
            summary: jsonResult.summary,
            structuredData: jsonResult.structuredData,
            aiResponse:
                jsonResult.aiResponse || "好的，我已嘗試根據您的指示進行調整。",
        };
    } catch (e) {
        console.error("無法解析 Gemini Nano 的對話 JSON 回應:", result, e);
        // If parsing fails, return the previous state so the calling UI can
        // present the original content and an informative aiResponse message.
        return {
            summary: currentSummary,
            structuredData: currentStructuredData,
            aiResponse: "抱歉，我無法理解您的指令或解析我的回應。請再試一次。",
        };
    }
}

// Export aliases to match App.jsx imports
export const summarizeWithGemini = summarizeAndExtract;

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

        const result = await chatWithGemini(simplePageContent, "", {}, fullPrompt);

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

// TODO: 添加其他 Nano API 封裝，例如 Proofreader, Rewriter 等