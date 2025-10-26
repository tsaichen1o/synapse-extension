import React from "react";

interface URLDisplayProps {
    url: string;
}

export function URLDisplay({ url }: URLDisplayProps): React.JSX.Element | null {
    if (!url) return null;

    return (
        <div className="mb-6 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Current Page</div>
            </div>
            <div className="text-sm font-mono text-gray-700 truncate bg-white/40 rounded-lg px-3 py-2">
                {url}
            </div>
        </div>
    );
}
