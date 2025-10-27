import React, { useState, useMemo } from "react";
import { StructuredData } from "../../lib/types";

interface StructuredDataDisplayProps {
    data: StructuredData;
    isFlashing?: boolean;
}

interface ModalData {
    key: string;
    value: string | string[];
}

const DEFAULT_MAX_TEXT_LENGTH = 50;
const TAG_MAX_LENGTH = 20;

export function StructuredDataDisplay({ data, isFlashing = false }: StructuredDataDisplayProps): React.JSX.Element | null {
    if (Object.keys(data).length === 0) return null;
    // View mode for structured data: 'list' (default) or 'tags'
    const [viewMode, setViewMode] = useState<'list' | 'tags'>('list');
    const [modalData, setModalData] = useState<ModalData | null>(null);

    const entries = useMemo(() => Object.entries(data), [data]);

    const truncateText = (text: string, maxLength: number = DEFAULT_MAX_TEXT_LENGTH): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleBubbleClick = (key: string, value: string | string[]): void => {
        setModalData({ key, value });
    };

    const closeModal = (): void => {
        setModalData(null);
    };

    const renderStructuredList = (): React.JSX.Element[] => {
        return entries.map(([key, value]) => {
            const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
            return (
                <div key={key} className="group mb-2 p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/60 transition-all duration-300 hover:shadow-md">
                    <span className="font-semibold text-purple-900 block text-sm mb-1">{key}</span>
                    <span className="text-gray-700 text-sm">{displayValue}</span>
                </div>
            );
        });
    };

    const renderBubbles = (): React.JSX.Element => {
        return (
            <div className="flex flex-wrap gap-x-2 gap-y-3">
                {entries.map(([key, value]) => {
                    // For arrays, show item count. For others, show the value.
                    const displayText = Array.isArray(value)
                        ? `${value.length} items`
                        : String(value);

                    const tagLabel = truncateText(displayText, TAG_MAX_LENGTH);

                    return (
                        <div
                            key={key}
                            className="flex items-center rounded-full bg-gray-200 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer overflow-hidden"
                            onClick={() => handleBubbleClick(key, value)}
                        >
                            <span className="px-3 py-1 bg-purple-200 text-purple-900 text-xs font-bold">
                                {key}
                            </span>
                            <span className="px-3 py-1 text-gray-700 text-xs">
                                {tagLabel}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`mb-6 animate-fadeIn rounded-2xl ${isFlashing ? 'animate-flash' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-800">Structured Information</h3>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'list' ? 'bg-purple-950/10 text-purple-800' : 'bg-white/30 text-gray-700'} border border-white/10 transition-colors`}
                        aria-pressed={viewMode === 'list'}
                        title="List view"
                        aria-label="List view"
                        type="button"
                    >
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('tags')}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'tags' ? 'bg-purple-950/10 text-purple-800' : 'bg-white/30 text-gray-700'} border border-white/10 transition-colors`}
                        aria-pressed={viewMode === 'tags'}
                        title="Tags view"
                        aria-label="Tags view"
                        type="button"
                    >
                        Tags
                    </button>
                </div>
            </div>

            <div>
                {viewMode === 'list' ? (
                    <div className="space-y-2">{renderStructuredList()}</div>
                ) : (
                    <div className="mt-2">{renderBubbles()}</div>
                )}
            </div>

            {/* Modal for full value display */}
            {modalData && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <h3 className="text-xl font-bold text-gray-800">{modalData.key}</h3>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                            {Array.isArray(modalData.value) ? (
                                <div className="space-y-2">
                                    {modalData.value.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-gray-700"
                                        >
                                            <span className="text-purple-600 font-medium mr-2">{index + 1}.</span>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-wrap break-words">
                                    {modalData.value}
                                </div>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
