import React from "react";
import { CondensedPageContent } from "../../lib/types";

interface ContentInfoProps {
    condensedContent: CondensedPageContent;
}

export function ContentInfo({ condensedContent }: ContentInfoProps): React.JSX.Element {
    return (
        <div className="mb-4 animate-fadeIn">
            <div className="p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-md rounded-2xl border border-blue-200/50 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Content Optimized</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/50 rounded-lg px-2 py-1">
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1 font-semibold text-gray-700">{condensedContent.metadata.contentType}</span>
                    </div>
                    <div className="bg-white/50 rounded-lg px-2 py-1">
                        <span className="text-gray-500">Compression:</span>
                        <span className="ml-1 font-semibold text-green-600">{(condensedContent.compressionRatio * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-white/50 rounded-lg px-2 py-1">
                        <span className="text-gray-500">Original:</span>
                        <span className="ml-1 font-semibold text-gray-700">{condensedContent.originalLength.toLocaleString()} chars</span>
                    </div>
                    <div className="bg-white/50 rounded-lg px-2 py-1">
                        <span className="text-gray-500">Optimized:</span>
                        <span className="ml-1 font-semibold text-blue-600">{condensedContent.condensedLength.toLocaleString()} chars</span>
                    </div>
                </div>
                {condensedContent.metadata.tags && condensedContent.metadata.tags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200/50">
                        <h4 className="text-xs font-semibold text-gray-500 mb-2">Topics</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {condensedContent.metadata.tags.slice(0, 5).map((tag, idx) => (
                                <span
                                    key={idx}
                                    title={tag}
                                    className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full truncate max-w-[150px] hover:bg-blue-200 transition-colors"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
