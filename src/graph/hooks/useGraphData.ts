import { useCallback, useEffect, useState } from 'react';
import { db } from '../../lib/db';
import type { SynapseLink, SynapseNode } from '../../lib/types';

const buildMockData = (): { nodes: SynapseNode[]; links: SynapseLink[] } => {
    const mockNodes: SynapseNode[] = [
        {
            id: 1,
            type: 'paper',
            url: 'https://example.com/llm-review',
            title: 'LLM Review',
            summary: 'A review of Large Language Models.',
            structuredData: {
                Authors: ['Jane Doe', 'Chris Lin'],
                Year: '2023',
                Tags: ['LLM', 'Survey'],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 2,
            type: 'concept',
            url: '',
            title: 'Transformer',
            summary: 'The core architecture of modern LLMs.',
            structuredData: {
                Introduced: '2017',
                Inventors: ['Vaswani', 'Shazeer'],
                Tags: ['Architecture'],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 3,
            type: 'paper',
            url: 'https://example.com/attention',
            title: 'Attention Is All You Need',
            summary: 'The original paper introducing the Transformer.',
            structuredData: {
                Authors: ['Vaswani', 'Shazeer'],
                Year: '2017',
                Tags: ['Transformer'],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 4,
            type: 'tool',
            url: 'https://tensorflow.org',
            title: 'TensorFlow',
            summary: 'An open-source machine learning framework.',
            structuredData: {
                Maintainer: 'Google',
                Tags: ['Framework', 'Open Source'],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 5,
            type: 'concept',
            url: '',
            title: 'Deep Learning',
            summary: 'A subfield of machine learning.',
            structuredData: {
                Tags: ['Machine Learning'],
                Introduced: '1980s',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    const mockLinks: SynapseLink[] = [
        { id: 1, sourceId: 1, targetId: 3, reason: 'Cites', createdAt: new Date(), type: 'manual' },
        { id: 2, sourceId: 1, targetId: 2, reason: 'Explains', createdAt: new Date(), type: 'manual' },
        { id: 3, sourceId: 3, targetId: 2, reason: 'Introduces', createdAt: new Date(), type: 'manual' },
    ];

    return { nodes: mockNodes, links: mockLinks };
};

export const useGraphData = () => {
    const [nodes, setNodes] = useState<SynapseNode[]>([]);
    const [links, setLinks] = useState<SynapseLink[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            let fetchedNodes = await db.nodes.toArray();
            let fetchedLinks = await db.links.toArray();

            if (fetchedNodes.length === 0) {
                const mock = buildMockData();
                fetchedNodes = mock.nodes;
                fetchedLinks = mock.links;
            }

            setNodes(fetchedNodes);
            setLinks(fetchedLinks);
        };

        const refresh = () => {
            fetchData().catch(error => {
                console.warn('Failed to refresh graph data', error);
            });
        };

        fetchData().catch(error => {
            console.warn('Failed to load graph data', error);
        });

        db.nodes.hook('creating', refresh);
        db.nodes.hook('updating', refresh);
        db.nodes.hook('deleting', refresh);
        db.links.hook('creating', refresh);
        db.links.hook('updating', refresh);
        db.links.hook('deleting', refresh);

        return () => {
            db.nodes.hook('creating').unsubscribe(refresh);
            db.nodes.hook('updating').unsubscribe(refresh);
            db.nodes.hook('deleting').unsubscribe(refresh);
            db.links.hook('creating').unsubscribe(refresh);
            db.links.hook('updating').unsubscribe(refresh);
            db.links.hook('deleting').unsubscribe(refresh);
        };
    }, []);

    const updateNode = useCallback((updated: SynapseNode) => {
        setNodes(current => current.map(node => (node.id === updated.id ? updated : node)));
    }, []);

    const removeNode = useCallback((id: number) => {
        setNodes(current => current.filter(node => node.id !== id));
        setLinks(current => current.filter(link => link.sourceId !== id && link.targetId !== id));
    }, []);

    return {
        nodes,
        links,
        updateNode,
        removeNode,
        setNodes,
    };
};
