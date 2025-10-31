import { MutableRefObject, RefObject, useEffect } from 'react';
import * as d3 from 'd3';
import { GraphBuildResult, GraphLinkData, GraphNodeData } from '../types';

type PositionMap = Map<string, { x: number; y: number }>;

type RadiusAccessor = (node: GraphNodeData) => number;
type LinkColorAccessor = (link: GraphLinkData) => string;
type LinkWidthAccessor = (link: GraphLinkData) => number;
type NodeFillAccessor = (node: GraphNodeData) => string;
type NodeClickHandler = (node: GraphNodeData) => void;
type CanvasClickHandler = () => void;

interface UseGraphSimulationParams {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    graphData: GraphBuildResult;
    nodePositionsRef: MutableRefObject<PositionMap>;
    getNodeRadius: RadiusAccessor;
    getLinkColor: LinkColorAccessor;
    getLinkWidth: LinkWidthAccessor;
    getNodeFill: NodeFillAccessor;
    onNodeClick: NodeClickHandler;
    onCanvasClick: CanvasClickHandler;
}

interface SimulationNode extends d3.SimulationNodeDatum {
    id: string;
    data: GraphNodeData;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
    id: string;
    data: GraphLinkData;
}

export const useGraphSimulation = ({
    canvasRef,
    graphData,
    nodePositionsRef,
    getNodeRadius,
    getLinkColor,
    getLinkWidth,
    getNodeFill,
    onNodeClick,
    onCanvasClick,
}: UseGraphSimulationParams) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || graphData.nodes.length === 0) {
            const ctx = canvas?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            return;
        }

        const rawContext = canvas.getContext('2d');
        if (!rawContext) return;
        const context = rawContext;

        const width = canvas.parentElement?.clientWidth ?? 800;
        const height = canvas.parentElement?.clientHeight ?? 600;
        const devicePixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio ?? 1;
        const scaledWidth = Math.floor(width * devicePixelRatio);
        const scaledHeight = Math.floor(height * devicePixelRatio);

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

        const storedPositions = nodePositionsRef.current;
        const allowedIds = new Set(graphData.nodes.map(node => node.id));
        Array.from(storedPositions.keys()).forEach(key => {
            if (!allowedIds.has(key)) {
                storedPositions.delete(key);
            }
        });

        const totalNodes = graphData.nodes.length;
        const centerX = width / 2;
        const centerY = height / 2;
        const layoutRadius = Math.max(Math.min(width, height) * 0.35, 80);
        const angleStep = totalNodes > 0 ? (2 * Math.PI) / totalNodes : 0;

        const simNodes: SimulationNode[] = graphData.nodes.map((node, index) => {
            const previous = storedPositions.get(node.id);
            if (previous) {
                return {
                    id: node.id,
                    data: node,
                    x: previous.x,
                    y: previous.y,
                };
            }

            if (totalNodes <= 1) {
                return {
                    id: node.id,
                    data: node,
                    x: centerX,
                    y: centerY,
                };
            }

            const angle = angleStep * index;
            const jitter = (Math.random() - 0.5) * getNodeRadius(node) * 2;

            return {
                id: node.id,
                data: node,
                x: centerX + layoutRadius * Math.cos(angle) + jitter,
                y: centerY + layoutRadius * Math.sin(angle) + jitter,
            };
        });

        const nodeMap = new Map<string, SimulationNode>();
        simNodes.forEach(node => nodeMap.set(node.id, node));

        const simLinks: SimulationLink[] = graphData.links
            .map(link => {
                const source = nodeMap.get(link.sourceId);
                const target = nodeMap.get(link.targetId);
                if (!source || !target) return null;
                return {
                    id: link.id,
                    source,
                    target,
                    data: link,
                } as SimulationLink;
            })
            .filter((link): link is SimulationLink => link !== null);

        const neighborMap = new Map<string, Set<string>>();
        simLinks.forEach(link => {
            const sourceId = (link.source as SimulationNode).id;
            const targetId = (link.target as SimulationNode).id;

            if (!neighborMap.has(sourceId)) {
                neighborMap.set(sourceId, new Set());
            }
            if (!neighborMap.has(targetId)) {
                neighborMap.set(targetId, new Set());
            }
            neighborMap.get(sourceId)!.add(targetId);
            neighborMap.get(targetId)!.add(sourceId);
        });

        let hoveredNode: SimulationNode | null = null;
        const nodeFocus = new Map<string, number>();
        const linkFocus = new Map<string, number>();

        simNodes.forEach(node => {
            if (!nodeFocus.has(node.id)) {
                nodeFocus.set(node.id, 0.65);
            }
        });

        simLinks.forEach(link => {
            if (!linkFocus.has(link.id)) {
                linkFocus.set(link.id, 0.7);
            }
        });

        const isBrowser = typeof window !== 'undefined';
        let rafId: number | null = null;
        const queueRender = () => {
            if (!isBrowser || rafId != null) {
                return;
            }
            rafId = window.requestAnimationFrame(() => {
                rafId = null;
                renderScene();
            });
        };
        const cancelRender = () => {
            if (rafId != null && isBrowser) {
                window.cancelAnimationFrame(rafId);
            }
            rafId = null;
        };

        const clampNodePosition = (node: SimulationNode) => {
            const radius = getNodeRadius(node.data);
            const maxX = width - radius;
            const maxY = height - radius;
            const safeX = node.x ?? radius;
            const safeY = node.y ?? radius;
            node.x = Math.min(Math.max(safeX, radius), Math.max(radius, maxX));
            node.y = Math.min(Math.max(safeY, radius), Math.max(radius, maxY));
        };

        const drawNode = (node: SimulationNode, focus: number) => {
            const radius = getNodeRadius(node.data);
            const isIsolatedValue = node.data.type === 'value' && node.data.meta?.isIsolatedValue;
            const baseAlpha = isIsolatedValue ? 0.32 : 0.55;
            const fillAlpha = Math.min(1, baseAlpha + focus * 0.55);
            const labelAlpha = Math.min(1, 0.25 + focus * (isIsolatedValue ? 0.9 : 1));
            const glowStrength = 8 + focus * 20;
            const strokeStrength = Math.min(3.4, 1.6 + focus * 1.8);
            const highlight = focus > 0.82;

            context.save();
            context.globalAlpha = fillAlpha;
            context.shadowColor = highlight ? 'rgba(129, 140, 248, 0.5)' : 'rgba(79, 70, 229, 0.18)';
            context.shadowBlur = glowStrength;
            context.beginPath();
            context.moveTo((node.x ?? 0) + radius, node.y ?? 0);
            context.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
            context.fillStyle = getNodeFill(node.data);
            context.fill();
            context.strokeStyle = 'rgba(255,255,255,0.92)';
            context.lineWidth = strokeStrength;
            context.stroke();

            context.shadowBlur = 0;
            context.globalAlpha = labelAlpha;
            context.fillStyle = focus > 0.68 || !isIsolatedValue ? '#111827' : 'rgba(55,65,81,0.55)';
            context.font = '12px Inter, sans-serif';
            context.textAlign = 'center';
            context.fillText(node.data.label, node.x ?? 0, (node.y ?? 0) + radius + 14);
            context.restore();
        };

        const drawLinkLabels = (highlightedLinkIds: Set<string>, highlightActive: boolean) => {
            context.save();
            context.font = '10px Inter, sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            simLinks.forEach(link => {
                if (!link.data.label) return;
                const source = link.source as SimulationNode;
                const target = link.target as SimulationNode;
                if (source.x == null || source.y == null || target.x == null || target.y == null) return;

                const isHighlighted = !highlightActive || highlightedLinkIds.has(link.id);
                const linkIntensity = linkFocus.get(link.id) ?? (isHighlighted ? 0.9 : 0.2);
                context.globalAlpha = Math.min(0.95, 0.25 + linkIntensity * 0.7);
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;
                const text = link.data.label;
                const metrics = context.measureText(text);
                const padding = 6;
                const boxWidth = metrics.width + padding;
                const boxHeight = 14;

                context.fillStyle = 'rgba(255,255,255,0.9)';
                context.fillRect(midX - boxWidth / 2, midY - boxHeight / 2, boxWidth, boxHeight);

                context.fillStyle = getLinkColor(link.data);
                context.fillText(text, midX, midY + 0.5);
            });

            context.globalAlpha = 1;
            context.restore();
        };

        const renderScene = () => {
            simNodes.forEach(clampNodePosition);
            context.clearRect(0, 0, width, height);

            const hoveredId = hoveredNode?.id ?? null;
            const highlightedNodeIds = new Set<string>();
            const highlightedLinkIds = new Set<string>();

            if (hoveredId) {
                highlightedNodeIds.add(hoveredId);
                const neighbors = neighborMap.get(hoveredId);
                neighbors?.forEach(id => highlightedNodeIds.add(id));

                simLinks.forEach(link => {
                    const sourceId = (link.source as SimulationNode).id;
                    const targetId = (link.target as SimulationNode).id;
                    if (sourceId === hoveredId || targetId === hoveredId) {
                        highlightedLinkIds.add(link.id);
                    }
                });
            }

            const highlightActive = highlightedNodeIds.size > 0;
            const defaultNodeFocus = highlightActive ? 0.18 : 0.65;
            let needsMoreFrames = false;

            simNodes.forEach(node => {
                const prev = nodeFocus.get(node.id) ?? defaultNodeFocus;
                let target = defaultNodeFocus;
                if (hoveredId && node.id === hoveredId) {
                    target = 1;
                } else if (highlightActive && highlightedNodeIds.has(node.id)) {
                    target = 0.72;
                }
                const next = prev + (target - prev) * 0.18;
                if (Math.abs(next - target) > 0.01) {
                    needsMoreFrames = true;
                }
                nodeFocus.set(node.id, next);
            });

            simLinks.forEach(link => {
                const prev = linkFocus.get(link.id) ?? (highlightActive ? 0.18 : 0.72);
                const target = highlightActive
                    ? highlightedLinkIds.has(link.id)
                        ? 0.95
                        : 0.1
                    : 0.72;
                const next = prev + (target - prev) * 0.2;
                if (Math.abs(next - target) > 0.01) {
                    needsMoreFrames = true;
                }
                linkFocus.set(link.id, next);
            });

            context.lineCap = 'round';
            simLinks.forEach(link => {
                const source = link.source as SimulationNode;
                const target = link.target as SimulationNode;
                if (source.x == null || source.y == null || target.x == null || target.y == null) return;

                const intensity = linkFocus.get(link.id) ?? 0.6;
                context.globalAlpha = Math.max(0.08, intensity * 0.85);
                context.strokeStyle = intensity > 0.55 ? getLinkColor(link.data) : 'rgba(203,213,225,0.55)';
                const baseWidth = getLinkWidth(link.data);
                context.lineWidth = baseWidth * (0.8 + intensity * 0.6);
                context.beginPath();
                context.moveTo(source.x, source.y);
                context.lineTo(target.x, target.y);
                context.stroke();
            });
            context.globalAlpha = 1;

            drawLinkLabels(highlightedLinkIds, highlightActive);

            simNodes.forEach(node => {
                const focus = nodeFocus.get(node.id) ?? defaultNodeFocus;
                drawNode(node, focus);
            });

            simNodes.forEach(node => {
                storedPositions.set(node.id, {
                    x: node.x ?? 0,
                    y: node.y ?? 0,
                });
            });

            if (needsMoreFrames) {
                queueRender();
            }
        };

        const simulation = d3
            .forceSimulation(simNodes)
            .force('link', d3.forceLink<SimulationNode, SimulationLink>(simLinks).id(node => node.id).distance(160))
            .force('charge', d3.forceManyBody().strength(-450))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<SimulationNode>(node => getNodeRadius(node.data) + 4))
            .force('radial', d3.forceRadial<SimulationNode>(layoutRadius, centerX, centerY).strength(0.6))
            .on('tick', renderScene);

        const updateHover = (node: SimulationNode | null) => {
            if (hoveredNode?.id === node?.id) return;
            hoveredNode = node;
            renderScene();
        };

        const drag = d3
            .drag<HTMLCanvasElement, SimulationNode>()
            .container(canvas)
            .subject(event => simulation.find(event.x, event.y, 32) ?? event)
            .on('start', event => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on('drag', event => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on('end', event => {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            });

        const handleClick = (evt: MouseEvent) => {
            const node = simulation.find(evt.offsetX, evt.offsetY, 30);
            if (node) {
                onNodeClick(node.data);
            } else {
                onCanvasClick();
            }
        };

        const handlePointerMove = (evt: MouseEvent) => {
            const node = simulation.find(evt.offsetX, evt.offsetY, 28);
            updateHover(node ?? null);
        };

        const handlePointerLeave = () => {
            updateHover(null);
        };

        d3.select<HTMLCanvasElement, SimulationNode>(canvas).call(drag);
        d3.select(canvas).on('click', handleClick);
        d3.select(canvas).on('mousemove', handlePointerMove);
        d3.select(canvas).on('mouseleave', handlePointerLeave);

        renderScene();

        return () => {
            simulation.stop();
            d3.select(canvas).on('click', null);
            d3.select(canvas).on('mousemove', null);
            d3.select(canvas).on('mouseleave', null);
            d3.select(canvas).on('.drag', null);
            cancelRender();
        };
    }, [
        canvasRef,
        graphData,
        getLinkColor,
        getLinkWidth,
        getNodeFill,
        getNodeRadius,
        nodePositionsRef,
        onCanvasClick,
        onNodeClick,
    ]);
};
