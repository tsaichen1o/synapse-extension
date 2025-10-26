import React from "react";

interface WelcomeScreenProps {
    isInitializing: boolean;
    initError: string;
    onInitialize: () => void;
}

export function WelcomeScreen({ isInitializing, initError, onInitialize }: WelcomeScreenProps): React.JSX.Element {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 flex items-center justify-center">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl animate-pulse">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                        Welcome to Synapse
                    </h1>
                    <p className="text-sm text-gray-600 font-medium mb-8">
                        AI-Powered Smart Web Summarization
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/30 shadow-2xl p-8 mb-6">
                    <div className="flex items-start gap-3 mb-6">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Initialize AI Model</h3>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                To get started, we need to initialize the AI model. This may download the model if it's not already available on your device.
                            </p>
                            <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100">
                                <p className="text-xs text-purple-700 font-medium">
                                    🔒 This requires your permission to download resources. Click the button below to proceed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onInitialize}
                        disabled={isInitializing}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {isInitializing ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Initializing AI Model...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Initialize AI</span>
                            </>
                        )}
                    </button>

                    {initError && (
                        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 animate-fadeIn">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800 mb-1">Initialization Error</p>
                                    <p className="text-xs text-red-700">{initError}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center text-xs text-gray-500 space-y-1">
                    <p className="font-medium">Powered by Gemini Nano</p>
                    <p className="text-gray-400">Chrome Built-in AI</p>
                </div>
            </div>
        </div>
    );
}
