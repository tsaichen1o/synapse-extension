import React from "react";
import { StructuredData } from "../../lib/types";

interface StructuredDataDisplayProps {
    data: StructuredData;
    isFlashing?: boolean;
}

export function StructuredDataDisplay({ data, isFlashing = false }: StructuredDataDisplayProps): React.JSX.Element | null {
    if (Object.keys(data).length === 0) return null;

    const renderStructuredData = (): React.JSX.Element[] => {
        return Object.entries(data).map(([key, value]) => {
            const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
            return (
                <div key={key} className="group mb-2 p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/60 transition-all duration-300 hover:shadow-md">
                    <span className="font-semibold text-purple-900 block text-sm mb-1">{key}</span>
                    <span className="text-gray-700 text-sm">{displayValue}</span>
                </div>
            );
        });
    };

    return (
        <div className={`mb-6 animate-fadeIn rounded-2xl ${isFlashing ? 'animate-flash' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-800">Structured Information</h3>
            </div>
            <div className="space-y-2">{renderStructuredData()}</div>
        </div>
    );
}
