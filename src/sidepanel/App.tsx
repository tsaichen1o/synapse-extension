import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from 'react-hot-toast';
import { db } from "../lib/db";
import { AI, isAIAvailable } from "../lib/ai";
import { getPageContent } from "../lib/helper";
import { ChatMessage, LoadingPhase, PageContent, StructuredData, CondensedPageContent } from "../lib/types";
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

function App(): React.JSX.Element {
    const [isAiInitialized, setIsAiInitialized] = useState<boolean>(false);
    const [isInitializing, setIsInitializing] = useState<boolean>(false);
    const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
    const [condenseProgress, setCondenseProgress] = useState<{ current: number; total: number } | null>(null);
    const [summarizeProgress, setSummarizeProgress] = useState<{ current: number; total: number } | null>(null);
    const [currentPageUrl, setCurrentPageUrl] = useState<string>("");
    const [currentPageContent, setCurrentPageContent] = useState<PageContent | null>(null);
    const [condensedContent, setCondensedContent] = useState<CondensedPageContent | null>(null);
    const [initialSummary, setInitialSummary] = useState<string>("");
    const [currentSummary, setCurrentSummary] = useState<string>("");
    const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
    const [structuredData, setStructuredData] = useState<StructuredData>({});
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // State to trigger animations on update
    const [justUpdated, setJustUpdated] = useState<'summary' | 'structured' | 'both' | null>(null);
    const [saveCooldown, setSaveCooldown] = useState<number | null>(null);

    const aiRef = useRef<AI | null>(null);

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

    // Effect to reset animation trigger
    useEffect(() => {
        if (justUpdated) {
            const timer = setTimeout(() => setJustUpdated(null), 1200); // Animation duration is 1.2s
            return () => clearTimeout(timer);
        }
    }, [justUpdated]);

    // Handle tab change events to update the current URL, but only when idle.
    useEffect(() => {
        const updateCurrentUrl = () => {
            if (loadingPhase === null && !initialSummary) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0] && tabs[0].url && tabs[0].url !== currentPageUrl) {
                        setCurrentPageUrl(tabs[0].url);
                    }
                });
            }
        };

        const handleTabActivated = (_activeInfo: { tabId: number, windowId: number }) => {
            updateCurrentUrl();
        };

        const handleTabUpdated = (tabId: number, changeInfo: { url?: string }, tab: chrome.tabs.Tab) => {
            if (tab.active && changeInfo.url) {
                if (loadingPhase === null && !initialSummary) {
                    setCurrentPageUrl(changeInfo.url);
                }
            }
        };

        updateCurrentUrl();

        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onUpdated.addListener(handleTabUpdated);

        // Cleanup: remove listeners when component unmounts
        return () => {
            chrome.tabs.onActivated.removeListener(handleTabActivated);
            chrome.tabs.onUpdated.removeListener(handleTabUpdated);
        };
    }, [initialSummary, currentPageUrl, loadingPhase]);

    // Cleanup AI instance on unmount
    useEffect(() => {
        return () => {
            if (aiRef.current) {
                console.log("Destroying AI instance on unmount");
                aiRef.current.destroy();
                aiRef.current = null;
            }
        };
    }, []);

    // Handle AI initialization triggered by user gesture
    const handleInitializeAI = async (): Promise<void> => {
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
    };

    const handleCapturePage = async (): Promise<void> => {
        if (!aiRef.current) {
            toast.error("AI is not ready. Please wait or refresh the page.");
            return;
        }

        setSaveCooldown(null);
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
            setLoadingPhase(null);
        } catch (error) {
            console.error("Capture or summarization failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Capture or summarization failed: ${errorMessage}`);
            setLoadingPhase(null);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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
            console.log("💬 Sending chat with condensed content...");
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
            setLoadingPhase(null);
        } catch (error) {
            console.error("Chat failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Chat failed: ${errorMessage}`);
            setLoadingPhase(null);
        }
    };

    const handleDiscard = useCallback((): void => {
        console.log("Discarding current session...");

        // Reset AI instance state
        if (aiRef.current) {
            aiRef.current.reset();
            console.log("AI instance has been reset.");
        }

        setSaveCooldown(null);
        setInitialSummary("");
        setCurrentSummary("");
        setStructuredData({});
        setChatMessages([]);
        setHasUserInteracted(false);
        setCurrentPageContent(null);
        setCondensedContent(null);
        setLoadingPhase(null);
        setChatInput("");

        // Re-fetch current URL to ensure it's up-to-date
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
            if (tabs[0] && tabs[0].url) {
                setCurrentPageUrl(tabs[0].url);
            }
        });
    }, []);

    useEffect(() => {
        if (saveCooldown === null) return;
        if (saveCooldown <= 0) {
            handleDiscard();
            return;
        }

        const timer = typeof window === "undefined"
            ? null
            : window.setTimeout(() => {
                setSaveCooldown(prev => (prev == null ? null : Math.max(prev - 1, 0)));
            }, 1000);

        return () => {
            if (timer !== null && typeof window !== "undefined") {
                window.clearTimeout(timer);
            }
        };
    }, [handleDiscard, saveCooldown]);

    const handleCancelAutoClear = useCallback(() => {
        setSaveCooldown(null);
    }, []);

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

    // Handle saving to knowledge base
    const handleSaveToDatabase = async (): Promise<void> => {
        console.log("handleSaveToDatabase called");
        setLoadingPhase("saving");
        try {
            // Validate that we have content to save
            if (!currentSummary || Object.keys(structuredData).length === 0) {
                console.log("Validation failed: missing summary or structured data");
                toast.error("Please capture page content first and let AI generate summary and structured information.");
                setLoadingPhase(null);
                setSaveCooldown(null);
                return;
            }

            console.log("Checking for existing node with URL:", currentPageUrl);
            // Check if this page already exists in the database
            const existingNode = await db.nodes.where('url').equalsIgnoreCase(currentPageUrl).first();
            console.log("Existing node:", existingNode);

            let nodeId: number | undefined;

            // TODO: add node type selection in the future
            const nodeData = {
                type: 'paper', // Assuming this is a paper; will be changed to dynamic template type later
                url: currentPageUrl,
                title: currentPageContent?.title || '',
                summary: currentSummary, // Use the latest summary (may be edited via chat)
                structuredData: structuredData, // Final Key-Value Pairs after AI collaboration
                chatHistory: chatMessages, // Conversation history
                // Store condensed content information
                condensedContent: condensedContent?.condensedContent,
                contentType: condensedContent?.metadata.contentType,
                tags: condensedContent?.metadata.tags, // Changed from mainTopics to tags
                description: condensedContent?.metadata.description,
                compressionRatio: condensedContent?.compressionRate,
                originalLength: condensedContent?.originalLength,
                condensedLength: condensedContent?.condensedLength,
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
                toast.success("Successfully updated in knowledge base!");
            } else {
                // Add new node
                console.log("Adding new node");
                nodeId = await db.nodes.add(nodeData);
                console.log(`Successfully added new node: ${nodeId}`);
                toast.success("Successfully saved to knowledge base!");
            }

            // Auto-create links with similar nodes
            if (nodeId) {
                await updateAutoLinks(nodeId, nodeData);
            }

            console.log("Setting loadingPhase to null");
            setLoadingPhase(null);
            setSaveCooldown(5);

            // (Optional) Automatically open knowledge graph after saving
            // chrome.tabs.create({ url: 'graph.html' });

        } catch (error) {
            console.error("Save failed with error:", error);
            console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Save failed: ${errorMessage}`);
            setLoadingPhase(null);
            setSaveCooldown(null);
        }
    };

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
                    onDiscard={handleDiscard}
                    onSave={handleSaveToDatabase}
                    saveCooldown={saveCooldown}
                    onCancelAutoClear={handleCancelAutoClear}
                />
            )}

            <GraphButton />

            <Footer />
        </div>
    );
}

export default App;