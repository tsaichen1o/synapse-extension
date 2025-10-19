// src/graph/GraphApp.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    MiniMap,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    NodeChange,
    EdgeChange,
    BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css'; // ReactFlow base styles

import { db, SynapseNode } from '../lib/db'; // Import our database
import NodeDetailPanel from './NodeDetailPanel'; // Node detail panel component

// Helper function to generate random initial node positions
const getInitialNodePosition = () => ({
    x: Math.random() * 800 + 100,
    y: Math.random() * 500 + 50,
});

// Define the custom data type for our nodes
interface NodeData {
    label: string;
    type: string;
    fullData: SynapseNode;
}

// Custom node styles based on type
const getNodeStyle = (type: string) => {
    const baseStyle = {
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        border: '2px solid',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: '180px',
        maxWidth: '250px',
    };

    switch (type) {
        case 'paper':
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderColor: '#5a67d8',
                color: 'white',
            };
        case 'concept':
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderColor: '#ed64a6',
                color: 'white',
            };
        case 'tool':
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderColor: '#4299e1',
                color: 'white',
            };
        default:
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                borderColor: '#9f7aea',
                color: '#2d3748',
            };
    }
};

function GraphApp() {
    const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNodeData, setSelectedNodeData] = useState<SynapseNode | null>(null); // Store selected node details
    const [showNodeDetailPanel, setShowNodeDetailPanel] = useState(false);

    // Handle node and edge changes (ReactFlow internal mechanism)
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    // Trigger when clicking a node
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
        setSelectedNodeData(node.data.fullData); // Pass complete node data
        setShowNodeDetailPanel(true);
    }, []);

    // Trigger when clicking ReactFlow background (deselect)
    const onPaneClick = useCallback(() => {
        setShowNodeDetailPanel(false);
        setSelectedNodeData(null);
    }, []);

    // Load data from IndexedDB
    useEffect(() => {
        const loadGraphData = async () => {
            const allNodes = await db.nodes.toArray();
            const allLinks = await db.links.toArray();

            // Convert database nodes to ReactFlow nodes format
            const rfNodes: Node<NodeData>[] = allNodes.map(node => ({
                id: node.id?.toString() || '', // ReactFlow requires string ID
                position: getInitialNodePosition(), // Random position, can use layout algorithm later
                data: { label: node.title, type: node.type, fullData: node }, // Store complete data in data
                type: 'default', // Or set different custom node type based on node.type
                style: getNodeStyle(node.type), // Apply custom styles
            }));

            // Convert database links to ReactFlow edges format
            const rfEdges: Edge[] = allLinks.map(link => ({
                id: link.id?.toString() || '',
                source: link.sourceId.toString(),
                target: link.targetId.toString(),
                label: link.reason, // Display link reason
                animated: true,
                type: 'smoothstep', // Smoother edge style
                style: {
                    stroke: '#9f7aea',
                    strokeWidth: 2,
                },
                labelStyle: {
                    fill: '#4a5568',
                    fontSize: 12,
                    fontWeight: 500,
                },
                labelBgStyle: {
                    fill: 'white',
                    fillOpacity: 0.9,
                },
            }));

            setNodes(rfNodes);
            setEdges(rfEdges);
        };

        loadGraphData();

        // Listen to IndexedDB changes (if you want real-time graph updates)
        // Dexie doesn't directly support real-time listening to all changes, but you can implement it through events or reloading
        // For simplicity, we're not implementing real-time listening here
    }, []);

    return (
        <div className="w-screen h-screen flex bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                fitView // Initially fit graph to viewport
                minZoom={0.5}
                maxZoom={2}
                defaultEdgeOptions={{
                    animated: true,
                }}
            >
                <MiniMap
                    nodeColor={(node) => {
                        const nodeData = node.data as NodeData;
                        return nodeData.type === 'paper' ? '#667eea' : '#f093fb';
                    }}
                    maskColor="rgba(255, 255, 255, 0.6)"
                />
                <Controls />
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    color="#d4d4d8"
                />
            </ReactFlow>

            {/* Node Detail Panel */}
            <NodeDetailPanel
                nodeData={selectedNodeData}
                isOpen={showNodeDetailPanel}
                onClose={() => setShowNodeDetailPanel(false)}
            />
        </div>
    );
}

export default GraphApp;