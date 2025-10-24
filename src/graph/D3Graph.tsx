// src/graph/D3Graph.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { db, SynapseNode, SynapseLink } from '../lib/db';
import NodeDetailPanel from './NodeDetailPanel';

// Define simulation data types that D3 will use
interface SimulationNode extends d3.SimulationNodeDatum {
    id: string;
    data: SynapseNode;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
    id: string;
    data: SynapseLink;
}

const D3Graph: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [nodes, setNodes] = useState<SynapseNode[]>([]);
    const [links, setLinks] = useState<SynapseLink[]>([]);
    const [selectedNode, setSelectedNode] = useState<SynapseNode | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            let allNodes = await db.nodes.toArray();
            let allLinks = await db.links.toArray();

            // If the database is empty, generate mock data for demonstration
            if (allNodes.length === 0) {
                console.log("Database is empty. Generating mock data.");
                const mockNodes: SynapseNode[] = [
                    { id: 1, type: 'paper', url: 'https://example.com/llm-review', title: 'LLM Review', summary: 'A review of Large Language Models.', structuredData: {}, createdAt: new Date(), updatedAt: new Date() },
                    { id: 2, type: 'concept', url: '', title: 'Transformer', summary: 'The core architecture of modern LLMs.', structuredData: {}, createdAt: new Date(), updatedAt: new Date() },
                    { id: 3, type: 'paper', url: 'https://example.com/attention', title: 'Attention Is All You Need', summary: 'The original paper introducing the Transformer.', structuredData: {}, createdAt: new Date(), updatedAt: new Date() },
                    { id: 4, type: 'tool', url: 'https://tensorflow.org', title: 'TensorFlow', summary: 'An open-source machine learning framework.', structuredData: {}, createdAt: new Date(), updatedAt: new Date() },
                    { id: 5, type: 'concept', url: '', title: 'Deep Learning', summary: 'A subfield of machine learning.', structuredData: {}, createdAt: new Date(), updatedAt: new Date() },
                ];

                const mockLinks: SynapseLink[] = [
                    { id: 1, sourceId: 1, targetId: 2, reason: 'Discusses', createdAt: new Date() }, // LLM Review -> Transformer
                    { id: 2, sourceId: 3, targetId: 2, reason: 'Introduced', createdAt: new Date() }, // Attention Paper -> Transformer
                    { id: 3, sourceId: 1, targetId: 5, reason: 'Is a part of', createdAt: new Date() }, // LLM Review -> Deep Learning
                    { id: 4, sourceId: 4, targetId: 5, reason: 'Used for', createdAt: new Date() },   // TensorFlow -> Deep Learning
                ];

                // You can choose to save mock data to DB or just use it for the session
                // For now, just setting state without saving to DB
                allNodes = mockNodes;
                allLinks = mockLinks;
            }

            setNodes(allNodes);
            setLinks(allLinks);
        };

        fetchData();

        // Listen for database updates to re-render the graph
        const observer = () => {
            fetchData();
        };
        db.nodes.hook('creating', observer as any);
        db.nodes.hook('updating', observer as any);
        db.nodes.hook('deleting', observer as any);
        db.links.hook('creating', observer);
        db.links.hook('updating', observer);
        db.links.hook('deleting', observer);

        return () => {
            db.nodes.hook('creating').unsubscribe(observer);
            db.nodes.hook('updating').unsubscribe(observer);
            db.nodes.hook('deleting').unsubscribe(observer);
            db.links.hook('creating').unsubscribe(observer);
            db.links.hook('updating').unsubscribe(observer);
            db.links.hook('deleting').unsubscribe(observer);
        };
    }, []);

    const onNodeClick = (node: SynapseNode) => {
        setSelectedNode(node);
    };

    const handleClosePanel = () => {
        setSelectedNode(null);
    };

    useEffect(() => {
        if (!canvasRef.current || nodes.length === 0) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const width = canvas.parentElement?.clientWidth || 800;
        const height = canvas.parentElement?.clientHeight || 600;
        canvas.width = width;
        canvas.height = height;

        // Map our data to the format D3 simulation expects
        const simNodes: SimulationNode[] = nodes.map(n => ({ id: n.id!.toString(), data: n, x: Math.random() * width, y: Math.random() * height }));
        const simLinks: SimulationLink[] = links.map(l => ({
            id: l.id!.toString(),
            source: simNodes.find(n => n.id === l.sourceId.toString())!,
            target: simNodes.find(n => n.id === l.targetId.toString())!,
            data: l,
        })).filter(l => l.source && l.target); // Filter out broken links

        // Set up the D3 simulation
        const simulation = d3.forceSimulation(simNodes)
            .force('link', d3.forceLink<SimulationNode, SimulationLink>(simLinks).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .on('tick', ticked);

        function ticked() {
            if (!context) return;
            context.clearRect(0, 0, width, height);

            // Draw links
            context.strokeStyle = '#999';
            context.globalAlpha = 0.6;
            context.beginPath();
            simLinks.forEach(d => {
                context.moveTo((d.source as SimulationNode).x!, (d.source as SimulationNode).y!);
                context.lineTo((d.target as SimulationNode).x!, (d.target as SimulationNode).y!);
            });
            context.stroke();

            // Draw nodes
            context.globalAlpha = 1.0;
            simNodes.forEach(d => {
                context.beginPath();
                context.moveTo(d.x! + 15, d.y!);
                context.arc(d.x!, d.y!, 15, 0, 2 * Math.PI);
                context.fillStyle = getNodeColor(d.data.type);
                context.fill();
                context.strokeStyle = '#fff';
                context.stroke();

                // Draw labels
                context.fillStyle = '#000';
                context.font = '12px sans-serif';
                context.textAlign = 'center';
                context.fillText(d.data.title, d.x!, d.y! + 25);
            });
        }

        // Drag functionality
        d3.select<HTMLCanvasElement, SimulationNode>(canvas).call(d3.drag<HTMLCanvasElement, SimulationNode>()
            .container(canvas)
            .subject((event): d3.SubjectPosition | SimulationNode => {
                // Increase search radius for better usability on canvas
                const subject = simulation.find(event.x, event.y, 30);
                return subject || event;
            })
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

        function dragstarted(event: d3.D3DragEvent<HTMLCanvasElement, SimulationNode, any>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event: d3.D3DragEvent<HTMLCanvasElement, SimulationNode, any>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event: d3.D3DragEvent<HTMLCanvasElement, SimulationNode, any>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // Click handler
        d3.select(canvas).on('click', (event) => {
            // Increase search radius for better usability on canvas
            const node = simulation.find(event.offsetX, event.offsetY, 30);
            if (node) {
                onNodeClick(node.data);
            }
        });

        return () => {
            simulation.stop();
            // Clean up d3 event listeners
            d3.select(canvas).on('click', null);
            d3.select<HTMLCanvasElement, SimulationNode>(canvas).call(d3.drag<HTMLCanvasElement, SimulationNode>().on('start', null).on('drag', null).on('end', null));
        };

    }, [nodes, links]);

    const getNodeColor = (type: string) => {
        switch (type) {
            case 'paper': return '#667eea';
            case 'concept': return '#f093fb';
            case 'tool': return '#4facfe';
            default: return '#a8edea';
        }
    };

    return (
        <div className="w-full h-full relative">
            <canvas ref={canvasRef}></canvas>
            {selectedNode && (
                <NodeDetailPanel node={selectedNode} onClose={handleClosePanel} />
            )}
        </div>
    );
};

export default D3Graph;
