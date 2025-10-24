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
import * as d3 from 'd3'; // Import D3

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
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', // Smooth transitions
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
        [setNodes]
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
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

    // Load data from IndexedDB and run D3 simulation
    useEffect(() => {
        const loadGraphData = async () => {
            const allDbNodes = await db.nodes.toArray();
            const allDbLinks = await db.links.toArray();

            if (allDbNodes.length === 0) {
                return;
            }

            // Convert database nodes to ReactFlow nodes format
            const initialNodes: Node<NodeData>[] = allDbNodes.map(node => ({
                id: node.id!.toString(),
                position: { x: Math.random() * 800, y: Math.random() * 600 }, // Initial random position
                data: { label: node.title, type: node.type, fullData: node },
                style: getNodeStyle(node.type),
            }));

            // Convert database links to ReactFlow edges format
            const initialEdges: Edge[] = allDbLinks.map(link => ({
                id: `e-${link.sourceId}-${link.targetId}`,
                source: link.sourceId.toString(),
                target: link.targetId.toString(),
                label: link.reason,
                animated: true,
                type: 'smoothstep',
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

            setNodes(initialNodes);
            setEdges(initialEdges);

            // D3 force simulation
            const simulation = d3.forceSimulation(initialNodes as d3.SimulationNodeDatum[])
                .force("link", d3.forceLink(initialEdges).id(d => (d as Node).id).distance(200).strength(0.1))
                .force("charge", d3.forceManyBody().strength(-300))
                .force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
                .on("tick", () => {
                    setNodes(currentNodes =>
                        currentNodes.map(node => {
                            const simNode = initialNodes.find(n => n.id === node.id);
                            return {
                                ...node,
                                position: {
                                    x: simNode?.position.x ?? node.position.x,
                                    y: simNode?.position.y ?? node.position.y,
                                },
                            };
                        })
                    );
                });

            // Stop simulation after it cools down
            simulation.on('end', () => {
                console.log("D3 simulation ended.");
            });
        };

        loadGraphData();
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
                minZoom={0.3}
                maxZoom={2.5}
                defaultEdgeOptions={{
                    animated: true,
                }}
                nodesDraggable={true} // Allow dragging nodes
            >
                <MiniMap
                    nodeColor={(node) => {
                        const nodeData = node.data as NodeData;
                        switch (nodeData.type) {
                            case 'paper': return '#667eea';
                            case 'concept': return '#f093fb';
                            case 'tool': return '#4facfe';
                            default: return '#a8edea';
                        }
                    }}
                    maskColor="rgba(240, 240, 240, 0.6)"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    }}
                />
                <Controls
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        padding: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    }}
                />
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    color="#d4d4d8"
                />
            </ReactFlow>

            {/* Node Detail Panel */}
            {showNodeDetailPanel && (
                <NodeDetailPanel
                    node={selectedNodeData}
                    onClose={() => setShowNodeDetailPanel(false)}
                />
            )}
        </div>
    );
}

export default GraphApp;