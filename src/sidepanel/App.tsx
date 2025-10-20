import React, { useState, useEffect, useRef } from "react";
import { db } from "../lib/db";
import { AI, isAIAvailable } from "../lib/ai";
import { getPageContent } from "../lib/helper";
import {
    PageContent,
    StructuredData,
} from "../lib/types";

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
    const [currentPageContent, setCurrentPageContent] = useState<PageContent | null>(null);
    const [initialSummary, setInitialSummary] = useState<string>("");
    const [structuredData, setStructuredData] = useState<StructuredData>({}); // 用於 Key-Value Pairs
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const aiInstanceRef = useRef<AI | null>(null);
    const [aiReady, setAiReady] = useState<boolean>(false); // TODO(teresa1o): Use this state to disable buttons until AI is ready

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            console.log("Auto-scrolling chat container");
            console.log("Container scrollHeight:", chatContainerRef.current.scrollHeight);
            console.log("Container clientHeight:", chatContainerRef.current.clientHeight);
            console.log("Before scroll - scrollTop:", chatContainerRef.current.scrollTop);

            // Use requestAnimationFrame to ensure DOM is updated before scrolling
            requestAnimationFrame(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    console.log("After scroll - scrollTop:", chatContainerRef.current.scrollTop);
                }
            });
        } else {
            console.log("chatContainerRef.current is null!");
        }
    }, [chatMessages]);

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

    const mockAiSummary = "This paper provides a comprehensive review of Large Language Models (LLMs), tracing their evolution from early neural networks to modern Transformer architectures. It explores key innovations, deployment challenges, future research directions, and ethical and computational cost issues.";

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

        // Initialize AI instance when component mounts
        const initializeAI = async () => {
            try {
                const available = await isAIAvailable();
                if (!available) {
                    console.warn("AI is not available on this device");
                    setChatMessages([{
                        sender: "ai",
                        text: "⚠️ AI is not available. Please check if Chrome Built-in AI is enabled."
                    }]);
                    return;
                }

                console.log("Creating AI instance...");
                const ai = await AI.create({
                    temperature: 0.8,
                    topK: 50,
                    systemPrompt: 'You are a helpful assistant that analyzes web content, creates summaries, and refines structured data based on user feedback.'
                });
                aiInstanceRef.current = ai;
                console.log("AI instance ready");
            } catch (error) {
                console.error("Failed to initialize AI:", error);
                setChatMessages([{
                    sender: "ai",
                    text: `❌ Failed to initialize AI: ${error instanceof Error ? error.message : String(error)}`
                }]);
            }
        };

        initializeAI();

        // Cleanup: destroy AI instance when component unmounts
        return () => {
            if (aiInstanceRef.current) {
                console.log("Destroying AI instance on unmount");
                aiInstanceRef.current.destroy();
                aiInstanceRef.current = null;
            }
        };
    }, []);

    // 處理點擊「擷取此頁面」按鈕的事件
    const handleCapturePage = async (): Promise<void> => {
        if (!aiInstanceRef.current) {
            setChatMessages([{
                sender: "ai",
                text: "❌ AI is not ready. Please wait or refresh the page."
            }]);
            return;
        }

        setLoadingPhase("capturing");
        setInitialSummary("");
        setStructuredData({});
        setChatMessages([]);

        try {
            const pageContent = await getPageContent();
            setCurrentPageContent(pageContent); // Store for later use in chat
            
            setLoadingPhase("summarizing");
            const result = await aiInstanceRef.current.summarize(pageContent);
            
            setInitialSummary(result.summary);
            setStructuredData(result.structuredData);
            setChatMessages([
                {
                    sender: "ai",
                    text: `I have captured and summarized the page content. Here is the generated structured information:`,
                },
                { sender: "ai", text: `Summary: "${result.summary}"` },
            ]);
            setLoadingPhase(null);
        } catch (error) {
            console.error("Capture or summarization failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setChatMessages((prev: ChatMessage[]) => [
                ...prev,
                {
                    sender: "ai",
                    text: `Oops! An error occurred during capture or summarization: ${errorMessage}`,
                },
            ]);
            setLoadingPhase(null);
        }
    };

    // 處理聊天訊息發送
    const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        if (!aiInstanceRef.current || !currentPageContent) {
            setChatMessages((prev: ChatMessage[]) => [
                ...prev,
                {
                    sender: "ai",
                    text: "❌ AI is not ready or no page content captured. Please capture a page first."
                }
            ]);
            return;
        }

        const userMessage: ChatMessage = { sender: "user", text: chatInput };
        setChatMessages((prev: ChatMessage[]) => [...prev, userMessage]);
        setChatInput("");
        setLoadingPhase("chatting");

        try {
            const aiResponse = await aiInstanceRef.current.chat(
                currentPageContent,
                initialSummary,
                structuredData,
                userMessage.text
            );

            // Update summary and structured data based on AI response
            setInitialSummary(aiResponse.summary);
            setStructuredData(aiResponse.structuredData);

            const aiMessage: ChatMessage = {
                sender: "ai",
                text: aiResponse.aiResponse,
            };
            setChatMessages((prev: ChatMessage[]) => [...prev, aiMessage]);
            setLoadingPhase(null);
        } catch (error) {
            console.error("Chat failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const aiMessage: ChatMessage = {
                sender: "ai",
                text: `Sorry, an error occurred while chatting with AI: ${errorMessage}`,
            };
            setChatMessages((prev: ChatMessage[]) => [...prev, aiMessage]);
            setLoadingPhase(null);
        }
    };

    // Auto-create links based on keyword similarity
    const createAutoLinks = async (currentNodeId: number, currentNodeData: any): Promise<void> => {
        console.log("Creating auto-links for node:", currentNodeId);

        try {
            // Get all existing nodes except the current one
            const allNodes = await db.nodes.toArray();
            const otherNodes = allNodes.filter(node => node.id !== currentNodeId);

            if (otherNodes.length === 0) {
                console.log("No other nodes to link with");
                return;
            }

            // Extract keywords from current node
            const currentKeywords = extractKeywords(currentNodeData.summary, currentNodeData.structuredData);

            // Find similar nodes and create links
            for (const otherNode of otherNodes) {
                const otherKeywords = extractKeywords(otherNode.summary || '', otherNode.structuredData || {});
                const similarity = calculateSimilarity(currentKeywords, otherKeywords);

                // Create link if similarity is above threshold (e.g., 0.3)
                if (similarity > 0.3) {
                    // Check if link already exists
                    const existingLink = await db.links
                        .where('sourceId').equals(currentNodeId)
                        .and(link => link.targetId === otherNode.id!)
                        .first();

                    if (!existingLink) {
                        await db.links.add({
                            sourceId: currentNodeId,
                            targetId: otherNode.id!,
                            reason: `Related topics: ${findCommonKeywords(currentKeywords, otherKeywords).join(', ')}`,
                            createdAt: new Date()
                        });
                        console.log(`Created link: ${currentNodeId} -> ${otherNode.id}`);
                    }
                }
            }
        } catch (error) {
            console.error("Error creating auto-links:", error);
        }
    };

    // Extract keywords from text and structured data
    const extractKeywords = (text: string, structuredData: any): Set<string> => {
        const keywords = new Set<string>();

        // Extract from text (convert to lowercase and split)
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3); // Only words longer than 3 chars

        words.forEach(word => keywords.add(word));

        // Extract from structured data
        Object.values(structuredData).forEach(value => {
            if (typeof value === 'string') {
                const valueWords = value.toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 3);
                valueWords.forEach(word => keywords.add(word));
            } else if (Array.isArray(value)) {
                value.forEach(item => {
                    if (typeof item === 'string') {
                        const itemWords = item.toLowerCase()
                            .replace(/[^\w\s]/g, ' ')
                            .split(/\s+/)
                            .filter(word => word.length > 3);
                        itemWords.forEach(word => keywords.add(word));
                    }
                });
            }
        });

        return keywords;
    };

    // Calculate similarity between two sets of keywords (Jaccard similarity)
    const calculateSimilarity = (keywords1: Set<string>, keywords2: Set<string>): number => {
        const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
        const union = new Set([...keywords1, ...keywords2]);

        return union.size > 0 ? intersection.size / union.size : 0;
    };

    // Find common keywords between two sets
    const findCommonKeywords = (keywords1: Set<string>, keywords2: Set<string>): string[] => {
        return [...keywords1].filter(k => keywords2.has(k)).slice(0, 3); // Return top 3 common keywords
    };

    // Handle saving to knowledge base
    const handleSaveToDatabase = async (): Promise<void> => {
        console.log("handleSaveToDatabase called");
        setLoadingPhase("saving");
        try {
            // Validate that we have content to save
            if (!initialSummary || Object.keys(structuredData).length === 0) {
                console.log("Validation failed: missing summary or structured data");
                setChatMessages((prev: ChatMessage[]) => [
                    ...prev,
                    {
                        sender: "ai",
                        text: "Please capture page content first and let AI generate summary and structured information."
                    },
                ]);
                setLoadingPhase(null);
                return;
            }

            console.log("Checking for existing node with URL:", currentPageUrl);
            // Check if this page already exists in the database
            const existingNode = await db.nodes.where('url').equalsIgnoreCase(currentPageUrl).first();
            console.log("Existing node:", existingNode);

            let nodeId: number | undefined;

            const nodeData = {
                type: 'paper', // Assuming this is a paper; will be changed to dynamic template type later
                url: currentPageUrl,
                title: mockPageContent.title || 'Unknown Title', // Temporarily use mock title; will get from getPageContent later
                summary: initialSummary, // Original AI summary
                structuredData: structuredData, // Final Key-Value Pairs after AI collaboration
                chatHistory: chatMessages, // Conversation history
                createdAt: existingNode ? existingNode.createdAt : new Date(),
                updatedAt: new Date(),
            };

            console.log("Node data to save:", nodeData);

            if (existingNode) {
                // Update existing node
                console.log("Updating existing node with id:", existingNode.id);
                await db.nodes.update(existingNode.id!, nodeData);
                nodeId = existingNode.id!;
                console.log(`Successfully updated node: ${nodeId}`);

                const successMessage: ChatMessage = { sender: "ai", text: "✅ Successfully updated in knowledge base!" };
                console.log("Adding success message:", successMessage);
                setChatMessages((prev: ChatMessage[]) => {
                    const newMessages = [...prev, successMessage];
                    console.log("Previous messages count:", prev.length);
                    console.log("New messages count:", newMessages.length);
                    console.log("New chat messages:", newMessages);
                    return newMessages;
                });
            } else {
                // Add new node
                console.log("Adding new node");
                nodeId = await db.nodes.add(nodeData);
                console.log(`Successfully added new node: ${nodeId}`);

                const successMessage: ChatMessage = { sender: "ai", text: "✅ Successfully saved to knowledge base!" };
                console.log("Adding success message:", successMessage);
                setChatMessages((prev: ChatMessage[]) => {
                    const newMessages = [...prev, successMessage];
                    console.log("Previous messages count:", prev.length);
                    console.log("New messages count:", newMessages.length);
                    console.log("New chat messages:", newMessages);
                    return newMessages;
                });
            }

            // Auto-create links with similar nodes
            if (nodeId) {
                await createAutoLinks(nodeId, nodeData);
            }

            console.log("Setting loadingPhase to null");
            setLoadingPhase(null);

            // (Optional) Automatically open knowledge graph after saving
            // chrome.tabs.create({ url: 'graph.html' });

        } catch (error) {
            console.error("Save failed with error:", error);
            console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setChatMessages((prev: ChatMessage[]) => [
                ...prev,
                { sender: "ai", text: `Save failed: ${errorMessage}` },
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
        console.log("renderChatMessages called with", chatMessages.length, "messages");
        return chatMessages.map((message, index) => {
            console.log(`Rendering message ${index + 1}/${chatMessages.length}:`, message.text.substring(0, 50) + "...");
            return (
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
                            {message.sender === "user" ? "You" : "🤖 AI Assistant"}
                        </div>
                        <div className="text-sm leading-relaxed">{message.text}</div>
                    </div>
                </div>
            );
        });
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
                    AI-Powered Smart Web Summarization
                </p>
            </div>

            {/* 當前頁面信息 */}
            {currentPageUrl && (
                <div className="mb-6 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Current Page</div>
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
                            <span>Capturing page content...</span>
                        </>
                    ) : loadingPhase === "summarizing" ? (
                        <>
                            <svg className="animate-pulse h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>AI analyzing...</span>
                        </>
                    ) : (
                        <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Capture This Page</span>
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
                        <h3 className="text-lg font-bold text-gray-800">Summary</h3>
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
                        <h3 className="text-lg font-bold text-gray-800">Structured Information</h3>
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
                        <h3 className="text-lg font-bold text-gray-800">Chat with AI</h3>
                    </div>
                    <div
                        ref={chatContainerRef}
                        className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-4 max-h-80 overflow-y-auto space-y-2 scroll-smooth"
                    >
                        {(() => {
                            const messages = renderChatMessages();
                            console.log("Actually rendering", messages.length, "message elements in DOM");
                            return messages;
                        })()}
                        {loadingPhase === "chatting" && (
                            <div className="flex items-center justify-center gap-2 text-purple-600 text-sm py-4">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>AI thinking...</span>
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
                                placeholder="Chat with AI, e.g.: Simplify the summary, add more keywords..."
                                className="w-full px-4 py-3 pr-12 bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-md text-sm placeholder:text-gray-400"
                                disabled={loadingPhase === "chatting"}
                            />
                            <button
                                type="submit"
                                disabled={loadingPhase === "chatting" || !chatInput.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white p-2 rounded-xl transition-all duration-300 shadow-lg disabled:shadow-none transform hover:scale-105 active:scale-95"
                                title="Send message"
                                aria-label="Send message"
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
                        onClick={() => {
                            console.log("Save button clicked!");
                            handleSaveToDatabase();
                        }}
                        disabled={loadingPhase !== null}
                        className="w-full bg-white/60 backdrop-blur-md hover:bg-white/80 disabled:bg-gray-300/60 border border-purple-200 text-purple-700 font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loadingPhase === "saving" ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                <span>Save to Knowledge Base</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* 查看知識圖譜按鈕 */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        console.log("Opening knowledge graph...");
                        chrome.tabs.create({ url: chrome.runtime.getURL('graph.html') });
                    }}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>View Knowledge Graph</span>
                </button>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-8 space-y-1">
                <p className="font-medium">Powered by Gemini Nano</p>
                <p className="text-gray-400">Chrome Built-in AI</p>
            </div>
        </div>
    );
}

export default App;