import React from "react";

interface SummaryDisplayProps {
    summary: string;
    title: string;
    isFlashing?: boolean;
}

export function SummaryDisplay({ summary, title, isFlashing = false }: SummaryDisplayProps): React.JSX.Element {
    return (
        <div className={`mb-6 animate-fadeIn rounded-2xl ${isFlashing ? 'animate-flash' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            <div className="p-5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                <p className="text-gray-700 leading-relaxed text-sm">{summary}</p>
            </div>
        </div>
    );
}
