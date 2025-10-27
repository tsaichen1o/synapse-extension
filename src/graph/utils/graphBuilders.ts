import { SynapseLink, SynapseNode } from '../../lib/db';
import { extractKeywords } from '../../lib/graph-utils';
import {
    GraphBuildResult,
    GraphLinkData,
    GraphNodeData,
    GraphViewMode,
} from '../types';

const KEYWORD_SIMILARITY_THRESHOLD = 0.22;

interface KeywordBucket {
    key: string;
    value: string;
    notes: SynapseNode[];
}

const flattenStructuredData = (structuredData?: Record<string, unknown>): Array<{ key: string; value: string }> => {
    if (!structuredData) return [];
    const result: Array<{ key: string; value: string }> = [];

    Object.entries(structuredData).forEach(([key, rawValue]) => {
        if (Array.isArray(rawValue)) {
            rawValue.forEach(item => {
                if (typeof item === 'string' && item.trim()) {
                    result.push({ key, value: item.trim() });
                }
            });
        } else if (typeof rawValue === 'string' && rawValue.trim()) {
            result.push({ key, value: rawValue.trim() });
        } else if (rawValue !== undefined && rawValue !== null) {
            result.push({ key, value: String(rawValue) });
        }
    });

    return result;
};

const buildValueViewGraph = (notes: SynapseNode[]): GraphBuildResult => {
    const nodes: GraphNodeData[] = [];
    const links: GraphLinkData[] = [];
    const valueNodes = new Map<string, GraphNodeData>();
    let valueCounter = 0;

    notes.forEach(note => {
        if (note.id == null) return;
        const noteId = note.id;

        const noteNode: GraphNodeData = {
            id: `note:${noteId}`,
            label: note.title || 'Untitled',
            type: 'note',
            originalNode: note,
            meta: { valueSample: note.title ?? '', key: 'title' },
        };
        nodes.push(noteNode);

        flattenStructuredData(note.structuredData).forEach(({ key, value }) => {
            const mapKey = `${key}::${value.toLowerCase()}`;
            let valueNode = valueNodes.get(mapKey);
            if (!valueNode) {
                valueCounter += 1;
                valueNode = {
                    id: `value:${valueCounter}`,
                    label: value,
                    type: 'value',
                    meta: {
                        key,
                        valueSample: value,
                        associations: [],
                    },
                };
                valueNodes.set(mapKey, valueNode);
            }

            valueNode.meta?.associations?.push({
                key,
                noteId,
                noteTitle: note.title || 'Untitled',
            });

            links.push({
                id: `structured:${noteId}:${valueNode.id}:${key}`,
                sourceId: noteNode.id,
                targetId: valueNode.id,
                label: key,
                meta: { key, value, type: 'structured' },
            });
        });
    });

    nodes.push(...valueNodes.values());
    return { nodes, links };
};

const buildNoteViewGraph = (notes: SynapseNode[], links: SynapseLink[]): GraphBuildResult => {
    const nodes: GraphNodeData[] = notes
        .filter(note => note.id != null)
        .map(note => ({
            id: `note:${note.id}`,
            label: note.title || 'Untitled',
            type: 'note',
            originalNode: note,
        }));

    const graphLinks: GraphLinkData[] = [];

    links.forEach(link => {
        const sourceId = `note:${link.sourceId}`;
        const targetId = `note:${link.targetId}`;
        graphLinks.push({
            id: `db:${link.id ?? `${sourceId}->${targetId}`}`,
            sourceId,
            targetId,
            label: link.reason,
            meta: { type: link.type ?? 'manual' },
        });
    });

    const keyIndex = new Map<string, KeywordBucket>();
    notes.forEach(note => {
        if (note.id == null) return;
        flattenStructuredData(note.structuredData).forEach(({ key, value }) => {
            const indexKey = `${key}:${value.toLowerCase()}`;
            const bucket = keyIndex.get(indexKey) ?? { key, value, notes: [] };
            bucket.notes.push(note);
            keyIndex.set(indexKey, bucket);
        });
    });

    const seen = new Set<string>();
    keyIndex.forEach(({ key, value, notes: bucketNotes }) => {
        if (bucketNotes.length < 2) return;
        for (let i = 0; i < bucketNotes.length; i += 1) {
            for (let j = i + 1; j < bucketNotes.length; j += 1) {
                const a = bucketNotes[i];
                const b = bucketNotes[j];
                if (a.id == null || b.id == null) continue;
                const pairKey = `${Math.min(a.id, b.id)}|${Math.max(a.id, b.id)}|${key}|${value}`;
                if (seen.has(pairKey)) continue;
                seen.add(pairKey);
                graphLinks.push({
                    id: `shared:${pairKey}`,
                    sourceId: `note:${a.id}`,
                    targetId: `note:${b.id}`,
                    label: `${key}: ${value}`,
                    meta: { key, value, type: 'structured' },
                });
            }
        }
    });

    return { nodes, links: graphLinks };
};

const jaccardSimilarity = (left: Set<string>, right: Set<string>): number => {
    if (left.size === 0 && right.size === 0) return 0;
    const intersection = [...left].filter(word => right.has(word)).length;
    const union = new Set([...left, ...right]).size;
    return union === 0 ? 0 : intersection / union;
};

const buildClusterViewGraph = (notes: SynapseNode[]): GraphBuildResult => {
    const keywordData = notes
        .filter(note => note.id != null)
        .map(note => ({
            note,
            keywords: extractKeywords(note.summary || '', note.structuredData || {}),
        }));

    const clusters: Array<{ notes: SynapseNode[]; keywords: string[] }> = [];
    const visited = new Set<number>();

    keywordData.forEach(entry => {
        if (entry.note.id == null || visited.has(entry.note.id)) return;

        const queue: Array<{ note: SynapseNode; keywords: Set<string> }> = [entry];
        const clusterNotes: SynapseNode[] = [];

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || !current.note.id || visited.has(current.note.id)) continue;
            visited.add(current.note.id);
            clusterNotes.push(current.note);

            keywordData.forEach(other => {
                if (!other.note.id || visited.has(other.note.id) || other.note.id === current.note.id) return;
                const similarity = jaccardSimilarity(current.keywords, other.keywords);
                if (similarity >= KEYWORD_SIMILARITY_THRESHOLD) {
                    queue.push(other);
                }
            });
        }

        if (clusterNotes.length === 0) return;

        const keywordCount = new Map<string, number>();
        clusterNotes.forEach(note => {
            const kws = extractKeywords(note.summary || '', note.structuredData || {});
            kws.forEach(word => {
                keywordCount.set(word, (keywordCount.get(word) ?? 0) + 1);
            });
        });

        const topKeywords = Array.from(keywordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([word]) => word);

        clusters.push({ notes: clusterNotes, keywords: topKeywords });
    });

    if (clusters.length === 0) {
        notes.forEach(note => {
            if (note.id == null) return;
            clusters.push({
                notes: [note],
                keywords: Array.from(extractKeywords(note.summary || '', note.structuredData || {})).slice(0, 4),
            });
        });
    }

    const nodes: GraphNodeData[] = [];
    const links: GraphLinkData[] = [];
    const noteNodes = new Map<number, GraphNodeData>();

    notes.forEach(note => {
        if (note.id == null) return;
        const graphNode: GraphNodeData = {
            id: `note:${note.id}`,
            label: note.title || 'Untitled',
            type: 'note',
            originalNode: note,
        };
        nodes.push(graphNode);
        noteNodes.set(note.id, graphNode);
    });

    clusters.forEach((cluster, index) => {
        const clusterId = `cluster:${index}`;
        const clusterNode: GraphNodeData = {
            id: clusterId,
            label: cluster.keywords.length > 0 ? cluster.keywords.join(', ') : `Cluster ${index + 1}`,
            type: 'cluster',
            meta: {
                clusterSize: cluster.notes.length,
                keywords: cluster.keywords,
            },
        };
        nodes.push(clusterNode);

        cluster.notes.forEach(note => {
            if (note.id == null) return;
            const noteNode = noteNodes.get(note.id);
            if (!noteNode) return;
            links.push({
                id: `cluster:${clusterId}:${note.id}`,
                sourceId: clusterId,
                targetId: noteNode.id,
                label: 'member',
                meta: { type: 'cluster' },
            });
        });
    });

    return { nodes, links };
};

export const buildGraphData = (mode: GraphViewMode, notes: SynapseNode[], links: SynapseLink[]): GraphBuildResult => {
    switch (mode) {
        case 'value':
            return buildValueViewGraph(notes);
        case 'cluster':
            return buildClusterViewGraph(notes);
        case 'note':
        default:
            return buildNoteViewGraph(notes, links);
    }
};
