
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NodeDetailPanel from './NodeDetailPanel';
import type { SynapseNode } from '../lib/types';
import { useGraphData } from './hooks/useGraphData';
import { useGraphSimulation } from './hooks/useGraphSimulation';
import { buildGraphData } from './utils/graphBuilders';
import { GraphLinkData, GraphNodeData, GraphViewMode, NodeKind } from './types';

interface InfoPanelData {
    title: string;
    lines: string[];
}

const NODE_COLORS: Record<NodeKind, string> = {
    note: '#7f9cf5',
    value: '#f6ad55',
    cluster: '#68d391',
};

const BASE_NODE_RADIUS: Record<NodeKind, number> = {
    note: 18,
    value: 12,
    cluster: 24,
};

const LINK_COLOR_MAP: Record<'manual' | 'auto' | 'structured' | 'cluster', string> = {
    manual: '#805ad5',
    auto: '#63b3ed',
    structured: '#a0aec0',
    cluster: '#48bb78',
};

const LINK_WIDTH_MAP: Record<'manual' | 'auto' | 'structured' | 'cluster', number> = {
    manual: 2.4,
    auto: 1.8,
    structured: 1.2,
    cluster: 2,
};

const VIEW_OPTIONS: Array<{ value: GraphViewMode; label: string; hint: string }> = [
    { value: 'value', label: 'Value Map', hint: 'Structured values become nodes; links show the field key' },
    { value: 'note', label: 'Note Graph', hint: 'All notes with edges from manual links and shared metadata' },
    { value: 'cluster', label: 'AI Cluster', hint: 'Notes grouped by keyword overlap into semantic clusters' },
];

const D3Graph: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    const { nodes, links, updateNode, refresh } = useGraphData();
    const [viewMode, setViewMode] = useState<GraphViewMode>('value');
    const [selectedNode, setSelectedNode] = useState<SynapseNode | null>(null);
    const [infoPanel, setInfoPanel] = useState<InfoPanelData | null>(null);
    useEffect(() => {
        setSelectedNode(null);
        setInfoPanel(null);
        nodePositionsRef.current.clear();
    }, [viewMode]);

    const graphData = useMemo(() => buildGraphData(viewMode, nodes, links), [viewMode, nodes, links]);

    const nodeLinkCount = useMemo(() => {
        const counts = new Map<string, number>();
        graphData.links.forEach(link => {
            counts.set(link.sourceId, (counts.get(link.sourceId) ?? 0) + 1);
            counts.set(link.targetId, (counts.get(link.targetId) ?? 0) + 1);
        });
        return counts;
    }, [graphData]);

    const getLinkColor = useCallback((link: GraphLinkData) => {
        const type = link.meta?.type ?? 'manual';
        return LINK_COLOR_MAP[type] ?? LINK_COLOR_MAP.manual;
    }, []);

    const getLinkWidth = useCallback((link: GraphLinkData) => {
        const type = link.meta?.type ?? 'manual';
        const base = LINK_WIDTH_MAP[type] ?? LINK_WIDTH_MAP.manual;

        if (type === 'structured') {
            const detailLength = (link.meta?.value?.length ?? 0) + (link.meta?.key ? 4 : 0);
            return Math.min(base + Math.log1p(detailLength) * 0.25, base + 1.2);
        }

        if (type === 'auto') {
            const similarity = link.meta?.similarity ?? 0;
            return Math.min(base + similarity * 3, base + 1.5);
        }

        if (type === 'cluster') {
            return base + 0.6;
        }

        return base;
    }, []);

    const getNodeFill = useCallback((node: GraphNodeData) => NODE_COLORS[node.type] ?? '#a0aec0', []);

    const handleNodeClick = useCallback((graphNode: GraphNodeData) => {
        if (graphNode.type === 'note' && graphNode.originalNode) {
            setSelectedNode(graphNode.originalNode);
            setInfoPanel(null);
            return;
        }

        if (graphNode.type === 'value' && graphNode.meta?.associations) {
            const lines = graphNode.meta.associations.map(assoc => `${assoc.key} ← ${assoc.noteTitle}`);
            setInfoPanel({
                title: graphNode.label,
                lines: lines.length > 0 ? lines : ['No linked notes yet.'],
            });
            setSelectedNode(null);
            return;
        }

        if (graphNode.type === 'cluster') {
            const lines: string[] = [];
            if (graphNode.meta?.clusterSize != null) {
                lines.push(`Items: ${graphNode.meta.clusterSize}`);
            }
            if (graphNode.meta?.keywords && graphNode.meta.keywords.length > 0) {
                lines.push(`Keywords: ${graphNode.meta.keywords.join(', ')}`);
            }
            setInfoPanel({
                title: graphNode.label,
                lines: lines.length > 0 ? lines : ['Cluster summary not available.'],
            });
            setSelectedNode(null);
            return;
        }

        setInfoPanel(null);
        setSelectedNode(null);
    }, []);

    const handleCanvasClick = useCallback(() => {
        setSelectedNode(null);
        setInfoPanel(null);
    }, []);

    const handleClosePanel = () => {
        setSelectedNode(null);
    };

    const handleNodeUpdate = (updated: SynapseNode) => {
        updateNode(updated);
        setSelectedNode(updated);
    };

    const handleNodeDelete = useCallback((deletedId: number) => {
        nodePositionsRef.current.delete(`note:${deletedId}`);
        setSelectedNode(null);
        setInfoPanel(null);
        refresh().catch(error => {
            console.warn('Failed to refresh graph after deletion', error);
        });
    }, [refresh]);

    const getNodeRadius = useCallback(
        (node: GraphNodeData) => {
            const degreeBoost = nodeLinkCount.get(node.id) ?? 0;

            if (node.type === 'value') {
                const associations = node.meta?.associations?.length ?? 0;
                const base = viewMode === 'value' ? 6 : BASE_NODE_RADIUS.value;
                const boost = Math.min(6, Math.log2(associations + 1) * 2.2);
                return base + boost;
            }

            if (node.type === 'note') {
                const boost = Math.min(12, Math.log2(degreeBoost + 1) * 4);
                return BASE_NODE_RADIUS.note + boost;
            }

            if (node.type === 'cluster') {
                const size = node.meta?.clusterSize ?? degreeBoost;
                const boost = Math.min(18, Math.sqrt(size) * 3.2);
                return BASE_NODE_RADIUS.cluster + boost;
            }

            return BASE_NODE_RADIUS.note;
        },
        [nodeLinkCount, viewMode],
    );

    useGraphSimulation({
        canvasRef,
        graphData,
        nodePositionsRef,
        getNodeRadius,
        getLinkColor,
        getLinkWidth,
        getNodeFill,
        onNodeClick: handleNodeClick,
        onCanvasClick: handleCanvasClick,
    });

    return (
        <div className="w-full h-full relative">
            <canvas ref={canvasRef} className="w-full h-full" />

            <div className="absolute top-4 right-4 flex bg-white/90 border border-purple-100 shadow-lg rounded-full overflow-hidden text-sm font-medium text-purple-700">
                {VIEW_OPTIONS.map(option => (
                    <button
                        key={option.value}
                        onClick={() => setViewMode(option.value)}
                        className={`px-4 py-2 transition-colors ${viewMode === option.value ? 'bg-purple-500 text-white' : 'hover:bg-purple-50'
                            }`}
                        title={option.hint}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {infoPanel && (
                <div className="absolute top-4 left-4 max-w-xs bg-white/95 border border-purple-100 shadow-xl rounded-xl px-4 py-3 text-sm text-gray-700 space-y-2">
                    <h4 className="font-semibold text-purple-600">{infoPanel.title}</h4>
                    <ul className="space-y-1">
                        {infoPanel.lines.map((line, index) => (
                            <li key={`${line}-${index}`} className="leading-snug">
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {selectedNode && (
                <NodeDetailPanel
                    node={selectedNode}
                    onClose={handleClosePanel}
                    onNodeUpdate={handleNodeUpdate}
                    onNodeDelete={handleNodeDelete}
                />
            )}
        </div>
    );
};

export default D3Graph;
