import { SynapseNode, SynapseLink } from '../lib/db';

export type GraphViewMode = 'value' | 'note' | 'cluster';

export type NodeKind = 'note' | 'value' | 'cluster';

export interface ValueAssociation {
    noteId: number;
    noteTitle: string;
    key: string;
}

export interface GraphNodeMeta {
    associations?: ValueAssociation[];
    clusterSize?: number;
    keywords?: string[];
    key?: string;
    valueSample?: string;
}

export interface GraphNodeData {
    id: string;
    label: string;
    type: NodeKind;
    originalNode?: SynapseNode;
    meta?: GraphNodeMeta;
}

export interface GraphLinkMeta {
    key?: string;
    value?: string;
    similarity?: number;
    type?: 'manual' | 'auto' | 'structured' | 'cluster';
}

export interface GraphLinkData {
    id: string;
    sourceId: string;
    targetId: string;
    label?: string;
    meta?: GraphLinkMeta;
}

export interface GraphBuildResult {
    nodes: GraphNodeData[];
    links: GraphLinkData[];
}

export type GraphDataBuilders = (mode: GraphViewMode, notes: SynapseNode[], links: SynapseLink[]) => GraphBuildResult;
