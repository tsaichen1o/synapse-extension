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

interface StructuredModalState {
    originalKey: string;
    key: string;
    value: string;
    treatAsArray: boolean;
}

function NodeDetailPanel({ node, onClose, onNodeUpdate }: NodeDetailPanelProps) {
    const [editableNode, setEditableNode] = useState<SynapseNode | null>(node);
    const [isDirty, setIsDirty] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [structuredModal, setStructuredModal] = useState<StructuredModalState | null>(null);

    useEffect(() => {
        setEditableNode(node);
        setIsDirty(false); // Reset dirty state when a new node is selected
        setIsEditingNotes(false);
        setStructuredModal(null);
    }, [node]);

    if (!editableNode) {
        return null;
    }

    const handleInputChange = <K extends keyof SynapseNode>(field: K, value: SynapseNode[K]) => {
        if (editableNode) {
            setEditableNode({ ...editableNode, [field]: value });
            setIsDirty(true);
        }
    };

    const openStructuredModal = (key: string, rawValue: unknown) => {
        const arrayValue = Array.isArray(rawValue);
        let normalized = '';

        if (arrayValue) {
            normalized = rawValue.join(', ');
        } else if (typeof rawValue === 'string') {
            normalized = rawValue;
        } else if (rawValue != null) {
            normalized = String(rawValue);
        }

        setStructuredModal({
            originalKey: key,
            key,
            value: normalized,
            treatAsArray: arrayValue,
        });
    };

    const closeStructuredModal = () => {
        setStructuredModal(null);
    };

    const parseStructuredValue = (input: string, forceArray: boolean): string | string[] => {
        const normalized = input.replace(/\r\n/g, '\n');
        const tokens = normalized
            .split(/[\n,]/)
            .map(segment => segment.trim())
            .filter(Boolean);

        if (forceArray || tokens.length > 1) {
            return tokens;
        }

        return input.trim();
    };

    const handleStructuredModalSave = () => {
        if (!editableNode || !editableNode.structuredData || !structuredModal) return;

        const trimmedKey = structuredModal.key.trim();
        const trimmedValue = structuredModal.value.trim();

        if (!trimmedKey) {
            toast.error('Field name cannot be empty.');
            return;
        }

        if (!trimmedValue) {
            toast.error('Value cannot be empty.');
            return;
        }

        const newData = { ...editableNode.structuredData };
        if (structuredModal.originalKey !== trimmedKey) {
            delete newData[structuredModal.originalKey];
        }

        newData[trimmedKey] = parseStructuredValue(trimmedValue, structuredModal.treatAsArray);

        setEditableNode({ ...editableNode, structuredData: newData });
        setIsDirty(true);
        closeStructuredModal();
    };

    const handleStructuredDelete = () => {
        if (!editableNode || !editableNode.structuredData || !structuredModal) return;

        const newData = { ...editableNode.structuredData };
        delete newData[structuredModal.originalKey];

        setEditableNode({
            ...editableNode,
            structuredData: newData,
        });
        setIsDirty(true);
        closeStructuredModal();
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
                        <div className="flex flex-wrap gap-x-2 gap-y-3">
                            {Object.entries(editableNode.structuredData).map(([key, value]) => {
                                const isArray = Array.isArray(value);
                                const displayText = isArray ? `${value.length} item${value.length > 1 ? 's' : ''}` : String(value);

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        className="group flex items-center rounded-full bg-gray-200 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 overflow-hidden"
                                        onClick={() => openStructuredModal(key, value)}
                                        title="Edit structured data"
                                    >
                                        <span className="px-3 py-1 bg-purple-200 text-purple-900 text-xs font-bold">
                                            {key}
                                        </span>
                                        <span className="px-3 py-1 text-gray-700 text-xs flex items-center gap-1">
                                            {displayText.length > 32 ? `${displayText.slice(0, 29)}...` : displayText}
                                            <svg
                                                className="w-3.5 h-3.5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.586 3.586a2 2 0 112.828 2.828l-7.5 7.5a2 2 0 01-.878.514l-3 1a.5.5 0 01-.63-.63l1-3a2 2 0 01.514-.878l7.5-7.5z" />
                                            </svg>
                                        </span>
                                    </button>
                                );
                            })}
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

            {structuredModal && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={closeStructuredModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-slideUp"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-purple-900">Edit Structured Data</h3>
                            </div>
                            <button
                                onClick={closeStructuredModal}
                                className="p-2 rounded-lg hover:bg-white/60 transition-colors"
                                aria-label="Close structured data editor"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                                    Field name
                                </label>
                                <input
                                    type="text"
                                    value={structuredModal.key}
                                    onChange={event =>
                                        setStructuredModal(current =>
                                            current
                                                ? {
                                                    ...current,
                                                    key: event.target.value,
                                                }
                                                : current,
                                        )
                                    }
                                    className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    placeholder="Enter field name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                                    Value
                                </label>
                                <textarea
                                    value={structuredModal.value}
                                    onChange={event =>
                                        setStructuredModal(current =>
                                            current
                                                ? {
                                                    ...current,
                                                    value: event.target.value,
                                                }
                                                : current,
                                        )
                                    }
                                    rows={4}
                                    className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                                    placeholder="Enter value or comma/newline separated list"
                                />
                                <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={structuredModal.treatAsArray}
                                        onChange={event =>
                                            setStructuredModal(current =>
                                                current
                                                    ? {
                                                        ...current,
                                                        treatAsArray: event.target.checked,
                                                    }
                                                    : current,
                                            )
                                        }
                                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    Treat as list (split by commas or new lines)
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-purple-100 bg-gray-50">
                            <button
                                type="button"
                                onClick={handleStructuredDelete}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" />
                                </svg>
                                Delete
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={closeStructuredModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStructuredModalSave}
                                    className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NodeDetailPanel;