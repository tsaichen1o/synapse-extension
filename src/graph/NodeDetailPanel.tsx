// src/graph/NodeDetailPanel.tsx
import React from 'react';
import { SynapseNode } from '../lib/db';

interface NodeDetailPanelProps {
    nodeData: SynapseNode | null;
    isOpen: boolean;
    onClose: () => void;
}

function NodeDetailPanel({ nodeData, isOpen, onClose }: NodeDetailPanelProps) {
    if (!isOpen || !nodeData) {
        return null;
    }

    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-white/95 backdrop-blur-lg shadow-2xl z-10 flex flex-col p-6 border-l border-purple-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words pr-4">{nodeData.title || 'Untitled'}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-purple-600 text-2xl font-bold transition-colors duration-200 hover:bg-purple-50 rounded-lg w-8 h-8 flex items-center justify-center"
                >
                    &times;
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 space-y-4">
                <a
                    href={nodeData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-800 underline mb-4 block truncate"
                >
                    {nodeData.url}
                </a>

                {/* Initial AI Summary */}
                {nodeData.summary && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            AI Summary
                        </h3>
                        <p className="text-sm text-gray-700 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100 leading-relaxed">{nodeData.summary}</p>
                    </div>
                )}

                {/* Structured Data (Key-Value Pairs) */}
                {nodeData.structuredData && Object.keys(nodeData.structuredData).length > 0 && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Structured Information
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(nodeData.structuredData).map(([key, value]) => (
                                <div key={key} className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-purple-100 hover:border-purple-200 transition-colors">
                                    <span className="font-semibold text-purple-700 block text-sm mb-1">{key}</span>
                                    <span className="text-gray-700 text-sm">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat History (Optional) */}
                {nodeData.chatHistory && nodeData.chatHistory.length > 0 && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-700 mb-2">Chat History</h3>
                        <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto border border-gray-100 space-y-2">
                            {nodeData.chatHistory.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-2 rounded-lg max-w-[80%] text-xs ${msg.sender === 'user' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-800'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Created Time */}
                {nodeData.createdAt && (
                    <p className="text-xs text-gray-400 mt-4">Saved at: {new Date(nodeData.createdAt).toLocaleString()}</p>
                )}
            </div>
        </div>
    );
}

export default NodeDetailPanel;