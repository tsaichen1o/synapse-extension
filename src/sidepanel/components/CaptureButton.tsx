import React, { useState, useEffect } from "react";
import { LoadingPhase } from "../types";

interface CaptureButtonProps {
    loadingPhase: LoadingPhase;
    hasInitialSummary: boolean;
    onCapture: () => void;
    condenseProgress?: { current: number; total: number } | null;
    summarizeProgress?: { current: number; total: number } | null;
}

export function CaptureButton({ loadingPhase, hasInitialSummary, onCapture, condenseProgress, summarizeProgress }: CaptureButtonProps): React.JSX.Element {
    const [progress, setProgress] = useState(0);
    const [prevPhase, setPrevPhase] = useState<LoadingPhase>(null);

    useEffect(() => {
        if (condenseProgress && loadingPhase === "condensing") {
            const realProgress = (condenseProgress.current / condenseProgress.total) * 100;
            setProgress(realProgress);
            return;
        }

        if (summarizeProgress && loadingPhase === "summarizing") {
            const realProgress = (summarizeProgress.current / summarizeProgress.total) * 100;
            setProgress(realProgress);
            return;
        }

        // If phase changed from condensing/summarizing to something else, complete the progress
        if ((prevPhase === "condensing" || prevPhase === "summarizing") &&
            loadingPhase !== prevPhase &&
            loadingPhase !== "condensing" &&
            loadingPhase !== "summarizing") {
            setProgress(100);
            setTimeout(() => setProgress(0), 500); // Reset after brief completion display
        }

        setPrevPhase(loadingPhase);

        // Fallback: If no real progress data available, reset
        if (loadingPhase === null || loadingPhase === "capturing") {
            setProgress(0);
        }
    }, [loadingPhase, prevPhase, condenseProgress, summarizeProgress]);

    const buttonBaseClasses = "group w-full font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-3 transform";

    const getButtonStateClasses = () => {
        if (loadingPhase === 'condensing' || loadingPhase === 'summarizing') {
            return "bg-purple-950/60 backdrop-blur-sm text-white";
        }
        if (loadingPhase !== null || hasInitialSummary) {
            return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-none";
        }
        return "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]";
    };

    return (
        <div className="mb-8">
            <button
                onClick={onCapture}
                disabled={loadingPhase !== null || hasInitialSummary}
                className={`${buttonBaseClasses} ${getButtonStateClasses()}`}
            >
                {loadingPhase === "capturing" ? (
                    <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Capturing page content...</span>
                    </>
                ) : loadingPhase === "condensing" ? (
                    <>
                        <div className="flex flex-col items-center gap-2 w-full">
                            <div className="flex items-center gap-3">
                                <svg className="animate-pulse h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span>
                                    {condenseProgress
                                        ? `Processing chunk ${condenseProgress.current}/${condenseProgress.total}...`
                                        : 'Condensing content...'
                                    }
                                </span>
                            </div>
                            <div className="w-full max-w-xs h-2 bg-purple-100/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300 ease-out relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                                </div>
                            </div>
                            <span className="text-xs text-purple-200/90 font-medium">{Math.round(progress)}%</span>
                        </div>
                    </>
                ) : loadingPhase === "summarizing" ? (
                    <>
                        <div className="flex flex-col items-center gap-2 w-full">
                            <div className="flex items-center gap-3">
                                <svg className="animate-pulse h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>
                                    {summarizeProgress
                                        ? `AI analyzing step ${summarizeProgress.current}/${summarizeProgress.total}...`
                                        : 'AI analyzing...'
                                    }
                                </span>
                            </div>
                            <div className="w-full max-w-xs h-2 bg-purple-100/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 rounded-full transition-all duration-300 ease-out relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                                </div>
                            </div>
                            <span className="text-xs text-purple-200/90 font-medium">{Math.round(progress)}%</span>
                        </div>
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
    );
}
