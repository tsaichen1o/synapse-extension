// Type definitions for Chrome AI and extension APIs
interface AISession {
    prompt(text: string): Promise<string>;
    destroy?(): void;
}

interface WindowAI {
    canCreateGenericSession?: () => Promise<boolean>;
    createGenericSession(): Promise<AISession>;
}

declare global {
    interface Window {
        ai?: WindowAI;
    }
}

// Type definitions for page content
export interface PageContent {
    title: string;
    url: string;
    content?: string;
    abstract?: string;
    fullText: string;
    metaDescription?: string;
    headings?: string[];
    links?: string[];
    images?: string[];
}

// Type definitions for structured data
export interface StructuredData {
    [key: string]: string | string[] | number | boolean | object;
}

// Type definitions for AI responses
export interface SummaryResponse {
    summary: string;
    structuredData: StructuredData;
}

export interface ChatResponse extends SummaryResponse {
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
    console.log("Initializing mock window.ai for development/testing");
    window.ai = {
        canCreateGenericSession: async (): Promise<boolean> => {
            return true;
        },
        createGenericSession: async (): Promise<AISession> => {
            return {
                prompt: async (text: string): Promise<string> => {
                    console.log("Mock AI received prompt:", text.substring(0, 100) + "...");

                    // Simple mock response based on prompt content
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

                    return "這是一個模擬的 AI 回應，因為 Gemini Nano 當前不可用。";
                }
            };
        }
    };
}

/**
 * Extract content from the current active tab
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
 * Function to be injected into the page to extract content
 * This function runs in the context of the web page
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
        throw new Error("Gemini Nano (window.ai) is not available.");
    }

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

    // Nano 的 Prompt API 可能會回傳一個完整的物件或一個字串
    const result = await session.prompt(promptText);
    try {
        const jsonResult = JSON.parse(result);
        return {
            summary: jsonResult.summary,
            structuredData: jsonResult.structuredData,
        };
    } catch (e) {
        console.error("無法解析 Gemini Nano 的 JSON 回應:", result, e);
        // 如果解析失敗，我們嘗試從結果中提取一些東西或直接回傳原始結果
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
        return {
            summary: currentSummary, // 解析失敗時回傳原始的，避免數據丟失
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