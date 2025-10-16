import React, { useState, useEffect } from "react";
import { db } from "../lib/db"; // 假設你已經有了 db.js，否則需要先創建
import {
    getPageContent,
    summarizeWithGemini,
    chatWithGemini,
    extractKeyValuePairs,
    PageContent,
    StructuredData,
    SummaryResponse,
    ChatResponse,
} from "../lib/ai";

// Type definitions for component state
interface ChatMessage {
    sender: "user" | "ai";
    text: string;
}

type LoadingPhase = "capturing" | "summarizing" | "chatting" | "saving" | null;

// 側邊欄主應用程式元件
function App(): React.JSX.Element {
    const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
    const [currentPageUrl, setCurrentPageUrl] = useState<string>("");
    const [initialSummary, setInitialSummary] = useState<string>("");
    const [structuredData, setStructuredData] = useState<StructuredData>({}); // 用於 Key-Value Pairs
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>("");

    // 模擬數據，之後從後端獲取
    const mockPageContent: PageContent = {
        title: "Understanding Large Language Models: A Comprehensive Review",
        url: "https://example.com/paper",
        fullText: "This paper provides a comprehensive review of Large Language Models (LLMs), tracing their evolution from early neural networks to modern transformer-based architectures. We discuss key innovations, challenges in deployment, and future research directions. Special attention is given to the ethical implications and computational costs associated with training and operating LLMs at scale.",
        abstract: "This paper provides a comprehensive review of Large Language Models (LLMs), tracing their evolution from early neural networks to modern transformer-based architectures. We discuss key innovations, challenges in deployment, and future research directions. Special attention is given to the ethical implications and computational costs associated with training and operating LLMs at scale.",
        metaDescription: "A comprehensive review of Large Language Models and their implications",
        headings: ["Introduction", "Methodology", "Results", "Discussion", "Conclusion"],
        links: ["https://example.com/reference1", "https://example.com/reference2"],
        images: ["https://example.com/figure1.png", "https://example.com/figure2.png"]
    };

    const mockAiSummary = "這篇論文全面回顧了大型語言模型 (LLMs) 的發展，從早期神經網路到現代 Transformer 架構。探討了關鍵創新、部署挑戰、未來研究方向以及倫理和計算成本問題。";

    const mockStructuredData: StructuredData = {
        "Paper Type": "Comprehensive Review",
        "Main Topic": "Large Language Models (LLMs)",
        "Key Innovations Discussed": [
            "Transformer-based architectures",
            "Ethical implications",
        ],
        "Challenges": ["Deployment", "Computational costs"],
    };

    useEffect(() => {
        // 獲取當前頁面 URL，用於儲存和識別
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
            if (tabs[0] && tabs[0].url) {
                setCurrentPageUrl(tabs[0].url);
            }
        });
    }, []);

    // 處理點擊「擷取此頁面」按鈕的事件
    const handleCapturePage = async (): Promise<void> => {
        setLoadingPhase("capturing");
        setInitialSummary("");
        setStructuredData({});
        setChatMessages([]);

        try {
            // TODO: 實際獲取頁面內容 (Phase 3 會實現)
            // const pageContent = await getPageContent();
            const pageContent = mockPageContent; // 暫時使用模擬數據

            setLoadingPhase("summarizing");
            // TODO: 呼叫 Gemini Nano 進行初始摘要和 Key-Value Pair 提取
            // const aiResult = await summarizeAndExtract(pageContent);
            // setInitialSummary(aiResult.summary);
            // setStructuredData(aiResult.structuredData);

            // 暫時使用模擬數據
            setTimeout(() => {
                setInitialSummary(mockAiSummary);
                setStructuredData(mockStructuredData);
                setChatMessages([
                    {
                        sender: "ai",
                        text: `我已為您擷取並摘要了頁面內容。目前生成的結構化資訊如下：`,
                    },
                    { sender: "ai", text: `摘要：「${mockAiSummary}」` },
                ]);
                setLoadingPhase(null);
            }, 1500);
        } catch (error) {
            console.error("擷取或摘要失敗:", error);
            const errorMessage = error instanceof Error ? error.message : "未知錯誤";
            setChatMessages((prev: ChatMessage[]) => [
                ...prev,
                {
                    sender: "ai",
                    text: `Oops! 擷取或摘要過程中出錯了: ${errorMessage}`,
                },
            ]);
            setLoadingPhase(null);
        }
    };

    // 處理聊天訊息發送
    const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage: ChatMessage = { sender: "user", text: chatInput };
        setChatMessages((prev: ChatMessage[]) => [...prev, userMessage]);
        setChatInput("");
        setLoadingPhase("chatting");

        try {
            // TODO: 實際實現與 Gemini Nano 的對話
            // const aiResponse = await chatWithGemini(
            // 	mockPageContent,
            // 	initialSummary,
            // 	structuredData,
            // 	userMessage.text
            // );

            // 暫時使用模擬回應
            setTimeout(() => {
                const aiMessage: ChatMessage = {
                    sender: "ai",
                    text: `我收到了您的指示：「${userMessage.text}」。我會根據這個指示來調整摘要和結構化數據。`,
                };
                setChatMessages((prev: ChatMessage[]) => [...prev, aiMessage]);
                setLoadingPhase(null);
            }, 1000);
        } catch (error) {
            console.error("聊天失敗:", error);
            const errorMessage = error instanceof Error ? error.message : "未知錯誤";
            const aiMessage: ChatMessage = {
                sender: "ai",
                text: `抱歉，與 AI 聊天時出錯了: ${errorMessage}`,
            };
            setChatMessages((prev: ChatMessage[]) => [...prev, aiMessage]);
            setLoadingPhase(null);
        }
    };

    // 處理儲存到資料庫
    const handleSaveToDatabase = async (): Promise<void> => {
        setLoadingPhase("saving");
        try {
            // TODO: 儲存到 Dexie 資料庫
            // await db.pages.add({
            // 	url: currentPageUrl,
            // 	title: mockPageContent.title,
            // 	summary: initialSummary,
            // 	structuredData: structuredData,
            // 	chatHistory: chatMessages,
            // 	createdAt: new Date(),
            // });

            // 暫時模擬儲存
            setTimeout(() => {
                setChatMessages((prev: ChatMessage[]) => [
                    ...prev,
                    { sender: "ai", text: "已成功儲存到本地資料庫！" },
                ]);
                setLoadingPhase(null);
            }, 800);
        } catch (error) {
            console.error("儲存失敗:", error);
            const errorMessage = error instanceof Error ? error.message : "未知錯誤";
            setChatMessages((prev: ChatMessage[]) => [
                ...prev,
                { sender: "ai", text: `儲存失敗: ${errorMessage}` },
            ]);
            setLoadingPhase(null);
        }
    };

    // 渲染結構化數據的輔助函數
    const renderStructuredData = (data: StructuredData): React.JSX.Element[] => {
        return Object.entries(data).map(([key, value]) => {
            const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
            return (
                <div key={key} className="group mb-2 p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/60 transition-all duration-300 hover:shadow-md">
                    <span className="font-semibold text-purple-900 block text-sm mb-1">{key}</span>
                    <span className="text-gray-700 text-sm">{displayValue}</span>
                </div>
            );
        });
    };

    // 渲染聊天訊息的輔助函數
    const renderChatMessages = (): React.JSX.Element[] => {
        return chatMessages.map((message, index) => (
            <div
                key={index}
                className={`mb-3 animate-fadeIn ${message.sender === "user" ? "flex justify-end" : "flex justify-start"
                    }`}
            >
                <div
                    className={`max-w-[85%] p-4 rounded-2xl backdrop-blur-sm ${message.sender === "user"
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg"
                        : "bg-white/60 text-gray-800 border border-white/30 shadow-md"
                        }`}
                >
                    <div className={`text-xs font-semibold mb-1 ${message.sender === "user" ? "text-purple-100" : "text-purple-600"}`}>
                        {message.sender === "user" ? "您" : "🤖 AI 助理"}
                    </div>
                    <div className="text-sm leading-relaxed">{message.text}</div>
                </div>
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Synapse
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                    AI 驅動的智慧網頁摘要工具
                </p>
            </div>

            {/* 當前頁面信息 */}
            {currentPageUrl && (
                <div className="mb-6 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">目前頁面</div>
                    </div>
                    <div className="text-sm font-mono text-gray-700 truncate bg-white/40 rounded-lg px-3 py-2">
                        {currentPageUrl}
                    </div>
                </div>
            )}

            {/* 主要操作按鈕 */}
            <div className="mb-8">
                <button
                    onClick={handleCapturePage}
                    disabled={loadingPhase !== null}
                    className="group w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    {loadingPhase === "capturing" ? (
                        <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>擷取頁面內容中...</span>
                        </>
                    ) : loadingPhase === "summarizing" ? (
                        <>
                            <svg className="animate-pulse h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>AI 分析中...</span>
                        </>
                    ) : (
                        <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>擷取此頁面</span>
                        </>
                    )}
                </button>
            </div>

            {/* 初始摘要顯示 */}
            {initialSummary && (
                <div className="mb-6 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-800">摘要</h3>
                    </div>
                    <div className="p-5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                        <p className="text-gray-700 leading-relaxed text-sm">{initialSummary}</p>
                    </div>
                </div>
            )}

            {/* 結構化數據顯示 */}
            {Object.keys(structuredData).length > 0 && (
                <div className="mb-6 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-800">結構化資訊</h3>
                    </div>
                    <div className="space-y-2">{renderStructuredData(structuredData)}</div>
                </div>
            )}

            {/* 聊天區域 */}
            {chatMessages.length > 0 && (
                <div className="mb-6 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-800">與 AI 對話</h3>
                    </div>
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-4 max-h-80 overflow-y-auto space-y-2">
                        {renderChatMessages()}
                        {loadingPhase === "chatting" && (
                            <div className="flex items-center justify-center gap-2 text-purple-600 text-sm py-4">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>AI 思考中...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 聊天輸入表單 */}
            {initialSummary && (
                <form onSubmit={handleChatSubmit} className="mb-6">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="與 AI 對話，例如：請簡化摘要、新增更多關鍵字..."
                                className="w-full px-4 py-3 pr-12 bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-md text-sm placeholder:text-gray-400"
                                disabled={loadingPhase === "chatting"}
                            />
                            <button
                                type="submit"
                                disabled={loadingPhase === "chatting" || !chatInput.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white p-2 rounded-xl transition-all duration-300 shadow-lg disabled:shadow-none transform hover:scale-105 active:scale-95"
                                title="發送訊息"
                                aria-label="發送訊息"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* 儲存按鈕 */}
            {initialSummary && (
                <div className="mb-6">
                    <button
                        onClick={handleSaveToDatabase}
                        disabled={loadingPhase !== null}
                        className="w-full bg-white/60 backdrop-blur-md hover:bg-white/80 disabled:bg-gray-300/60 border border-purple-200 text-purple-700 font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>{loadingPhase === "saving" ? "儲存中..." : "儲存到資料庫"}</span>
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-8 space-y-1">
                <p className="font-medium">Powered by Gemini Nano</p>
                <p className="text-gray-400">Chrome Built-in AI</p>
            </div>
        </div>
    );
}

export default App;