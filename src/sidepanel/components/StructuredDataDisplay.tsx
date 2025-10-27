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
    const [modalData, setModalData] = useState<ModalData | null>(null);

    const entries = useMemo(() => Object.entries(data), [data]);
    const MAX_TAGS = 12;
    const visibleEntries = useMemo(() => entries.slice(0, MAX_TAGS), [entries]);
    const hiddenCount = entries.length > MAX_TAGS ? entries.length - MAX_TAGS : 0;

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

    const renderBubbles = (): React.JSX.Element => {
        return (
            <div className="flex flex-wrap gap-x-2 gap-y-3">
                {visibleEntries.map(([key, value]) => {
                    const modalValue = Array.isArray(value) ? value : String(value);
                    const displayText = Array.isArray(value)
                        ? `${value.length} item${value.length > 1 ? 's' : ''}`
                        : String(value);
                    const tagLabel = truncateText(displayText, TAG_MAX_LENGTH);

                    return (
                        <button
                            key={key}
                            type="button"
                            className="flex items-center rounded-full bg-gray-200 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer overflow-hidden"
                            onClick={() => handleBubbleClick(key, modalValue)}
                        >
                            <span className="px-3 py-1 bg-purple-200 text-purple-900 text-xs font-bold">
                                {key}
                            </span>
                            <span className="px-3 py-1 text-gray-700 text-xs">
                                {tagLabel}
                            </span>
                        </button>
                    );
                })}

                {hiddenCount > 0 && (
                    <button
                        type="button"
                        className="px-4 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold shadow-sm hover:bg-purple-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        onClick={() => {
                            const remaining = entries.slice(MAX_TAGS);
                            const aggregatedValues = remaining.map(([entryKey, entryValue]) => {
                                const text = Array.isArray(entryValue) ? entryValue.join(', ') : String(entryValue);
                                return `${entryKey}: ${text}`;
                            });
                            handleBubbleClick(
                                `+${hiddenCount} more`,
                                aggregatedValues.length > 0 ? aggregatedValues : 'No additional data',
                            );
                        }}
                    >
                        +{hiddenCount} more
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className={`mb-6 animate-fadeIn rounded-2xl ${isFlashing ? 'animate-flash' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-800">Structured Information</h3>
            </div>

            <div className="mt-2">{renderBubbles()}</div>

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
