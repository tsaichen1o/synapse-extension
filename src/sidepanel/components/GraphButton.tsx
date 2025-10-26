import React from "react";

export function GraphButton(): React.JSX.Element {
    const handleOpenGraph = () => {
        console.log("Opening knowledge graph...");
        chrome.tabs.create({ url: chrome.runtime.getURL('graph.html') });
    };

    return (
        <div className="mb-6">
            <button
                onClick={handleOpenGraph}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>View Knowledge Graph</span>
            </button>
        </div>
    );
}
