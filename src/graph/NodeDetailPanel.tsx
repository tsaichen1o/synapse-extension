// src/graph/NodeDetailPanel.tsx
import { useState, useEffect } from 'react';
import { SynapseNode, db } from '../lib/db';
import toast from 'react-hot-toast';
import { updateAutoLinks } from '../lib/graph-utils';

interface NodeDetailPanelProps {
    node: SynapseNode | null;
    onClose: () => void;
    onNodeUpdate: (updatedNode: SynapseNode) => void;
}

function NodeDetailPanel({ node, onClose, onNodeUpdate }: NodeDetailPanelProps) {
    const [editableNode, setEditableNode] = useState<SynapseNode | null>(node);
    const [isDirty, setIsDirty] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editingDataKey, setEditingDataKey] = useState<string | null>(null);

    useEffect(() => {
        setEditableNode(node);
        setIsDirty(false); // Reset dirty state when a new node is selected
        setIsEditingNotes(false);
        setEditingDataKey(null);
    }, [node]);

    if (!editableNode) {
        return null;
    }

    const handleInputChange = (field: keyof SynapseNode, value: any) => {
        if (editableNode) {
            setEditableNode({ ...editableNode, [field]: value });
            setIsDirty(true);
        }
    };

    const handleStructuredDataChange = (oldKey: string, newKey: string, newValue: string) => {
        if (editableNode && editableNode.structuredData) {
            const newData = { ...editableNode.structuredData };
            const originalValue = newData[oldKey];

            // If the original value was an array, or the new string contains commas,
            // treat the new value as a comma-separated list.
            let finalValue: string | string[] = newValue;
            if (Array.isArray(originalValue) || newValue.includes(',')) {
                finalValue = newValue.split(',').map(s => s.trim()).filter(Boolean);
            }

            if (oldKey !== newKey) {
                delete newData[oldKey];
            }
            newData[newKey] = finalValue;
            setEditableNode({ ...editableNode, structuredData: newData });
            setIsDirty(true);
        }
    };

    const handleSave = async () => {
        if (editableNode && isDirty) {
            const nodeToSave = {
                ...editableNode,
                updatedAt: new Date(),
            };

            try {
                await db.nodes.update(editableNode.id!, nodeToSave);
                setIsDirty(false);
                onNodeUpdate(nodeToSave); // Notify parent component of the update
                toast.success('Node updated successfully!');

                // Trigger re-linking after saving
                await updateAutoLinks(nodeToSave.id!, nodeToSave);

            } catch (error) {
                console.error("Failed to update node:", error);
                toast.error('Failed to save changes.');
            }
        }
    };

    return (
        <div className="absolute top-0 right-0 h-full w-[26rem] bg-white/95 backdrop-blur-lg shadow-2xl z-10 flex flex-col border-l border-purple-200">
            <div className="px-6 pt-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                    <h2
                        className="text-xl font-bold w-full pr-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                        title={editableNode.title}
                    >
                        {editableNode.title || 'Untitled'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-purple-600 text-2xl font-bold transition-colors duration-200 hover:bg-purple-50 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0"
                        title="Close Panel"
                    >
                        &times;
                    </button>
                </div>
                <a
                    href={editableNode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-800 underline mb-4 block truncate"
                >
                    {editableNode.url}
                </a>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
                {/* Editable Notes */}
                <div className="mb-4">
                    <h3 className="font-semibold text-base text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                        </svg>
                        Notes
                    </h3>
                    {isEditingNotes ? (
                        <textarea
                            value={editableNode.summary || ''}
                            onChange={(e) => handleInputChange('summary', e.target.value)}
                            onBlur={() => setIsEditingNotes(false)}
                            autoFocus
                            className="w-full min-h-32 text-sm text-gray-700 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                            placeholder="Add your notes here..."
                        />
                    ) : (
                        <div
                            onClick={() => setIsEditingNotes(true)}
                            className="w-full text-sm text-gray-700 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100 leading-relaxed cursor-pointer hover:border-purple-300 transition whitespace-pre-wrap"
                            title="Click to edit"
                        >
                            {editableNode.summary || <span className="text-gray-400 italic">Add your notes here...</span>}
                        </div>
                    )}
                </div>

                {/* Editable Structured Data */}
                {editableNode.structuredData && Object.keys(editableNode.structuredData).length > 0 && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-base text-gray-700 mb-4 mt-6 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Structured Information
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(editableNode.structuredData).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-purple-100 group transition"
                                >
                                    {editingDataKey === key ? (
                                        <div
                                            onBlur={(e) => {
                                                // Only exit edit mode if the new focused element is NOT inside this container
                                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                    setEditingDataKey(null);
                                                }
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={key}
                                                onChange={(e) => handleStructuredDataChange(key, e.target.value, Array.isArray(value) ? value.join(', ') : String(value))}
                                                autoFocus
                                                className="font-semibold text-purple-700 block text-sm mb-1 w-full bg-transparent border-b-2 border-purple-300 focus:outline-none"
                                                placeholder="Key"
                                            />
                                            <textarea
                                                value={Array.isArray(value) ? value.join(', ') : String(value)}
                                                onChange={(e) => handleStructuredDataChange(key, key, e.target.value)}
                                                className="text-gray-700 text-sm w-full bg-transparent border-b-2 border-purple-300 focus:outline-none resize-none"
                                                rows={1}
                                                placeholder="Value"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setEditingDataKey(key)}
                                            className="cursor-pointer"
                                            title="Click to edit"
                                        >
                                            <div className="font-semibold text-purple-700 text-sm mb-1">{key}</div>
                                            <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                                {Array.isArray(value) ? value.join(', ') : String(value)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat History (Optional) */}
                {editableNode.chatHistory && editableNode.chatHistory.length > 0 && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-700 mt-6 mb-4">Chat History</h3>
                        <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto border border-gray-100 space-y-2">
                            {editableNode.chatHistory.map((msg, index) => (
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

                {/* Timestamps */}
                <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
                    {editableNode.createdAt && <p>Created: {new Date(editableNode.createdAt).toLocaleString()}</p>}
                    {editableNode.updatedAt && <p>Updated: {new Date(editableNode.updatedAt).toLocaleString()}</p>}
                </div>
            </div>

            <div className="px-6 py-9 border-t border-purple-200 mt-auto">

                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    title={isDirty ? 'Save your changes' : 'No changes to save'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>{isDirty ? 'Save Changes' : 'Saved'}</span>
                </button>
            </div>
        </div>
    );
}

export default NodeDetailPanel;