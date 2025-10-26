import React from "react";

type LoadingPhase = "capturing" | "condensing" | "summarizing" | "chatting" | "saving" | null;

interface ActionButtonsProps {
    loadingPhase: LoadingPhase;
    onDiscard: () => void;
    onSave: () => void;
}

export function ActionButtons({ loadingPhase, onDiscard, onSave }: ActionButtonsProps): React.JSX.Element {
    return (
        <div className="mb-6 grid grid-cols-2 gap-3">
            <button
                onClick={onDiscard}
                disabled={loadingPhase !== null}
                className="w-full bg-red-100/60 backdrop-blur-md hover:bg-red-200/80 disabled:bg-gray-300/60 border border-red-200 text-red-700 font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Discard</span>
            </button>
            <button
                onClick={onSave}
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
                        <span>Save</span>
                    </>
                )}
            </button>
        </div>
    );
}
