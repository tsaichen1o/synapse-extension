import React from "react";
import { LoadingPhase } from "../../lib/types";

interface ChatInputProps {
    chatInput: string;
    loadingPhase: LoadingPhase;
    onInputChange: (value: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({ chatInput, loadingPhase, onInputChange, onSubmit }: ChatInputProps): React.JSX.Element {
    return (
        <form onSubmit={onSubmit} className="mb-6">
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => onInputChange(e.target.value)}
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
    );
}
