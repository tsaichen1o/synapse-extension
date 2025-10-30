import React from "react";
import { ChatMessage, LoadingPhase } from "../../lib/types";

interface ChatPanelProps {
    messages: ChatMessage[];
    loadingPhase: LoadingPhase;
    chatContainerRef: React.RefObject<HTMLDivElement | null>;
    isSticky?: boolean;
}

export function ChatPanel({ messages, loadingPhase, chatContainerRef, isSticky = false }: ChatPanelProps): React.JSX.Element | null {
    if (messages.length === 0) return null;

    const renderChatMessages = (): React.JSX.Element[] => {
        console.log("renderChatMessages called with", messages.length, "messages");
        return messages.map((message, index) => {
            console.log(`Rendering message ${index + 1}/${messages.length}:`, message.text.substring(0, 50) + "...");
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

    const maxHeightClass = isSticky ? "max-h-[calc(100vh-196px)]" : "max-h-80";

    return (
        <div className="mb-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-800">Chat with AI</h3>
            </div>
            <div
                ref={chatContainerRef}
                className={`bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-4 ${maxHeightClass} overflow-y-auto space-y-2 scroll-smooth`}
            >
                {(() => {
                    const messageElements = renderChatMessages();
                    console.log("Actually rendering", messageElements.length, "message elements in DOM");
                    return messageElements;
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
    );
}
