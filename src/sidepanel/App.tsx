import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import toast from 'react-hot-toast';
import { db } from "../lib/db";
import { AI, isAIAvailable } from "../lib/ai";
import { getPageContent } from "../lib/helper";
import { ChatMessage, LoadingPhase, PageContent, StructuredData, CondensedPageContent, SynapseNode } from "../lib/types";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Header } from "./components/Header";
import { URLDisplay } from "./components/URLDisplay";
import { CaptureButton } from "./components/CaptureButton";
import { ContentInfo } from "./components/ContentInfo";
import { SummaryDisplay } from "./components/SummaryDisplay";
import { StructuredDataDisplay } from "./components/StructuredDataDisplay";
import { ChatPanel } from "./components/ChatPanel";
import { ChatInput } from "./components/ChatInput";
import { ActionButtons } from "./components/ActionButtons";
import { GraphButton } from "./components/GraphButton";
import { Footer } from "./components/Footer";
import { CustomToaster } from "./components/CustomToaster";
import { updateAutoLinks } from "../lib/graph-utils";

// Constants
const ANIMATION_DURATION_MS = 1200;
const AUTO_CLEAR_COUNTDOWN_SECONDS = 3;

function App(): React.JSX.Element {
    const [isAiInitialized, setIsAiInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
    const [condenseProgress, setCondenseProgress] = useState<{ current: number; total: number } | null>(null);
    const [summarizeProgress, setSummarizeProgress] = useState<{ current: number; total: number } | null>(null);
    const [currentPageUrl, setCurrentPageUrl] = useState("");
    const [currentPageContent, setCurrentPageContent] = useState<PageContent | null>(null);
    const [condensedContent, setCondensedContent] = useState<CondensedPageContent | null>(null);
    const [initialSummary, setInitialSummary] = useState("");
    const [currentSummary, setCurrentSummary] = useState("");
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [structuredData, setStructuredData] = useState<StructuredData>({});
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // State to trigger animations on update
    const [justUpdated, setJustUpdated] = useState<'summary' | 'structured' | 'both' | null>(null);
    const [saveCooldown, setSaveCooldown] = useState<number>(-1);

    const aiRef = useRef<AI | null>(null);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            // Use requestAnimationFrame to ensure DOM is updated before scrolling
            requestAnimationFrame(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            });
        }
    }, [chatMessages]);

    // Effect to reset animation trigger
    useEffect(() => {
        if (justUpdated) {
            const timer = setTimeout(() => setJustUpdated(null), ANIMATION_DURATION_MS);
            return () => clearTimeout(timer);
        }
    }, [justUpdated]);

    // Handle tab change events to update the current URL, but only when idle.
    useEffect(() => {
        const updateCurrentUrl = () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url) setCurrentPageUrl(tabs[0].url);
            });
        };

        updateCurrentUrl();

        const handleTabActivated = (_activeInfo: { tabId: number, windowId: number }) => {
            updateCurrentUrl();
        };

        const handleTabUpdated = (tabId: number, changeInfo: { url?: string }, tab: chrome.tabs.Tab) => {
            if (tab.active && changeInfo.url) {
                setCurrentPageUrl(changeInfo.url);
            }
        };

        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onUpdated.addListener(handleTabUpdated);
        return () => {
            chrome.tabs.onActivated.removeListener(handleTabActivated);
            chrome.tabs.onUpdated.removeListener(handleTabUpdated);
        };
    }, []);

    // Cleanup AI instance on unmount
    useEffect(() => {
        return () => {
            if (aiRef.current) {
                aiRef.current.destroy();
                aiRef.current = null;
            }
        };
    }, []);

    // Handle AI initialization triggered by user gesture
    const handleInitializeAI = useCallback(async (): Promise<void> => {
        setIsInitializing(true);

        try {
            const available = await isAIAvailable();
            if (!available) {
                toast.error("AI is not available on this device. Please check if Chrome Built-in AI is enabled.");
                setIsInitializing(false);
                return;
            }

            aiRef.current = await AI.create({
                temperature: 0.8,
                topK: 50,
                systemPrompt: 'You are a helpful assistant that analyzes web content, creates summaries, and refines structured data based on user feedback.'
            });
            setIsAiInitialized(true);
            setIsInitializing(false);
            toast.success("AI initialized successfully!");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(`Failed to initialize AI: ${errorMessage}`);
            setIsInitializing(false);
        }
    }, []);

    const handleCapturePage = useCallback(async (): Promise<void> => {
        if (!aiRef.current) {
            toast.error("AI is not ready. Please wait or refresh the page.");
            return;
        }

        setSaveCooldown(-1);
        setLoadingPhase("capturing");
        setInitialSummary("");
        setStructuredData({});
        setChatMessages([]);
        setCondensedContent(null);
        setCondenseProgress(null);
        setSummarizeProgress(null);

        try {
            const pageContent = await getPageContent();
            setCurrentPageContent(pageContent);

            setLoadingPhase("condensing");

            aiRef.current.setCondenseProgressCallback((current: number, total: number) => {
                setCondenseProgress({ current, total });
            });
            const condensed = await aiRef.current.condense(pageContent);
            setCondensedContent(condensed);
            setCondenseProgress(null);

            await aiRef.current.reset();
            await aiRef.current.appendImageContext(pageContent);

            setLoadingPhase("summarizing");
            aiRef.current.setSummarizeProgressCallback((current: number, total: number) => {
                setSummarizeProgress({ current, total });
            });
            const result = await aiRef.current.summarize(condensed);
            setInitialSummary(result.summary);
            setCurrentSummary(result.summary);
            setStructuredData(result.structuredData);
            setSummarizeProgress(null);

            setHasUserInteracted(false);
            setChatMessages([
                {
                    sender: "system",
                    text: `I have captured and summarized the page content. Here is the generated structured information:`,
                },
                { sender: "assistant", text: `Summary: "${result.summary}"` },
            ]);
            setLoadingPhase("idle");
        } catch (error) {
            console.error("Capture or summarization failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Capture or summarization failed: ${errorMessage}`);
            setLoadingPhase("idle");
        }
    }, []);

    const handleChatSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        if (!aiRef.current || !condensedContent) {
            toast.error("AI is not ready or no page content captured. Please capture a page first.");
            return;
        }

        const userMessage: ChatMessage = { sender: "user", text: chatInput };
        setChatMessages((prev: ChatMessage[]) => [...prev, userMessage]);
        setHasUserInteracted(true);
        setChatInput("");
        setLoadingPhase("chatting");

        try {
            const aiResponse = await aiRef.current.chat(
                condensedContent,
                currentSummary,
                structuredData,
                userMessage.text
            );

            // Check what has changed to trigger animations
            const summaryChanged = aiResponse.summary !== currentSummary;
            const structuredDataChanged = JSON.stringify(aiResponse.structuredData) !== JSON.stringify(structuredData);

            if (summaryChanged && structuredDataChanged) {
                setJustUpdated('both');
            } else if (summaryChanged) {
                setJustUpdated('summary');
            } else if (structuredDataChanged) {
                setJustUpdated('structured');
            }

            // Update the latest summary and structured data based on AI response
            setCurrentSummary(aiResponse.summary);
            setStructuredData(aiResponse.structuredData);

            const aiResponseMessage: ChatMessage = {
                sender: "assistant",
                text: aiResponse.aiResponse,
            };

            // Add AI's textual response to chat
            setChatMessages((prev: ChatMessage[]) => [...prev, aiResponseMessage]);
            setLoadingPhase("idle");
        } catch (error) {
            console.error("Chat failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Chat failed: ${errorMessage}`);
            setLoadingPhase("idle");
        }
    }, [chatInput, condensedContent, currentSummary, structuredData]);

    const handleReset = useCallback((): void => {
        if (aiRef.current) aiRef.current.reset();
        setSaveCooldown(-1);
        setInitialSummary("");
        setCurrentSummary("");
        setStructuredData({});
        setChatMessages([]);
        setHasUserInteracted(false);
        setCurrentPageContent(null);
        setCondensedContent(null);
        setLoadingPhase("idle");
        setChatInput("");
    }, []);

    // Countdown effect and auto-save when countdown reaches 0
    useEffect(() => {
        if (saveCooldown > 0) {
            const timer = setTimeout(() => {
                setSaveCooldown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (saveCooldown === 0) {
            setSaveCooldown(-1);
            performSave();
        }
    }, [saveCooldown]);

    // Actual save logic
    const performSave = useCallback(async (): Promise<void> => {
        setLoadingPhase("saving");
        try {
            if (!currentSummary || Object.keys(structuredData).length === 0) {
                toast.error("Please capture page content first and let AI generate summary and structured information.");
                setLoadingPhase("idle");
                return;
            }

            const existingNode = await db.nodes.where('url').equalsIgnoreCase(currentPageUrl).first();

            const nodeData: SynapseNode = {
                type: condensedContent?.metadata.contentType || 'generic',
                url: condensedContent?.url || '',
                title: condensedContent?.title || '',
                summary: currentSummary, // Use the latest summary (may be edited via chat)
                structuredData: structuredData, // Final Key-Value Pairs after AI collaboration
                chatHistory: chatMessages, // Conversation history
                createdAt: existingNode ? existingNode.createdAt : new Date(),
                updatedAt: new Date(),
            };

            if (existingNode) {
                await db.nodes.put({ ...nodeData, id: existingNode.id! });
                toast.success("Successfully updated in knowledge base!");
            } else {
                const nodeId = await db.nodes.add(nodeData);
                await updateAutoLinks(nodeId!, nodeData);
                toast.success("Successfully saved to knowledge base!");
            }

            handleReset();
        } catch (error) {
            console.error("Save failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Save failed: ${errorMessage}`);
            setLoadingPhase("idle");
        }
    }, [currentSummary, structuredData, currentPageUrl, condensedContent, chatMessages]);

    // Show initialization screen if AI is not initialized
    if (!isAiInitialized) {
        return (
            <>
                <CustomToaster />
                <WelcomeScreen
                    isInitializing={isInitializing}
                    onInitialize={handleInitializeAI}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-6 pb-6 pt-12">
            <CustomToaster />
            <Header />
            <URLDisplay url={currentPageUrl} />
            <CaptureButton
                loadingPhase={loadingPhase}
                hasInitialSummary={!!initialSummary}
                onCapture={handleCapturePage}
                condenseProgress={condenseProgress}
                summarizeProgress={summarizeProgress}
            />

            <div className={`transition-all duration-500 mb-4 ${hasUserInteracted ? 'flex flex-row gap-6' : 'flex flex-col'}`}>
                <div className={`transition-all duration-500 ${hasUserInteracted ? 'w-1/2' : 'w-full'}`}>
                    {condensedContent && <ContentInfo condensedContent={condensedContent} />}

                    {initialSummary && !hasUserInteracted && (
                        <SummaryDisplay
                            summary={initialSummary}
                            title="Captured Summary"
                            isFlashing={false}
                        />
                    )}

                    {(currentSummary && (hasUserInteracted || currentSummary !== initialSummary)) && (
                        <SummaryDisplay
                            summary={currentSummary}
                            title="Latest Summary"
                            isFlashing={justUpdated === 'summary' || justUpdated === 'both'}
                        />
                    )}

                    <StructuredDataDisplay
                        data={structuredData}
                        isFlashing={justUpdated === 'structured' || justUpdated === 'both'}
                    />
                </div>

                {hasUserInteracted && (
                    <div className="w-1/2">
                        <div className="sticky top-6">
                            <ChatPanel
                                messages={chatMessages}
                                loadingPhase={loadingPhase}
                                chatContainerRef={chatContainerRef}
                                isSticky={true}
                            />

                            {initialSummary && (
                                <ChatInput
                                    chatInput={chatInput}
                                    loadingPhase={loadingPhase}
                                    onInputChange={setChatInput}
                                    onSubmit={handleChatSubmit}
                                />
                            )}
                        </div>
                    </div>
                )}

                {!hasUserInteracted && (
                    <div className="w-full">
                        <ChatPanel
                            messages={chatMessages}
                            loadingPhase={loadingPhase}
                            chatContainerRef={chatContainerRef}
                            isSticky={false}
                        />

                        {initialSummary && (
                            <ChatInput
                                chatInput={chatInput}
                                loadingPhase={loadingPhase}
                                onInputChange={setChatInput}
                                onSubmit={handleChatSubmit}
                            />
                        )}
                    </div>
                )}
            </div>

            {initialSummary && (
                <ActionButtons
                    loadingPhase={loadingPhase}
                    onDiscard={handleReset}
                    onSave={() => setSaveCooldown(AUTO_CLEAR_COUNTDOWN_SECONDS)}
                    saveCooldown={saveCooldown}
                    onCancelAutoClear={() => setSaveCooldown(-1)}
                />
            )}

            <GraphButton />

            <Footer />
        </div>
    );
}

export default App;