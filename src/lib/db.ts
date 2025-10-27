import Dexie, { type EntityTable } from "dexie";


declare global {
    interface Window {
        clearSynapseDB: () => void;
        addMockData: () => Promise<void>;
    }
}


// Define interfaces for our database tables
export interface SynapseNode {
    id?: number;
    type: string;
    url: string;
    title: string;
    createdAt: Date;
    updatedAt?: Date;
    summary?: string;
    structuredData?: Record<string, unknown>;
    chatHistory?: Array<{ sender: "user" | "ai"; text: string }>;
}

export interface SynapseLink {
    id?: number;
    sourceId: number;
    targetId: number;
    reason: string;
    createdAt: Date;
    type?: 'auto' | 'manual';
}

// Define the database schema
export interface SynapseDatabase extends Dexie {
    nodes: EntityTable<SynapseNode, 'id'>;
    links: EntityTable<SynapseLink, 'id'>;
}

export const db = new Dexie("SynapseKnowledgeBase") as SynapseDatabase;

// Version 1: Initial schema
db.version(1).stores({
    nodes: '++id, type, url, title, createdAt', // Initial schema
    links: '++id, sourceId, targetId, reason, createdAt' // Links table
});

// Version 2: Add updatedAt field (migration)
db.version(2).stores({
    nodes: '++id, type, url, title, createdAt, updatedAt', // Added updatedAt, removed unique constraint from url
    links: '++id, sourceId, targetId, reason, createdAt' // Links table unchanged
});
// 在開發模式下，你可以導出一些方便的函式來清空資料庫
if (import.meta.env?.DEV) {
    window.clearSynapseDB = (): void => {
        db.nodes.clear();
        db.links.clear();
        console.log("Synapse database cleared!");
    };

    window.addMockData = async (): Promise<void> => {
        await db.nodes.clear();
        await db.links.clear();

        const node1 = await db.nodes.add({
            type: 'paper',
            url: 'https://arxiv.org/abs/1706.03762',
            title: 'Attention Is All You Need',
            summary: 'The Transformer architecture revolutionized NLP by replacing recurrence with self-attention mechanisms, enabling parallel processing and better long-range dependencies.',
            structuredData: {
                'Authors': ['Vaswani', 'Shazeer', 'Parmar'],
                'Year': '2017',
                'Key Contribution': 'Transformer Architecture',
                'Citations': '100,000+'
            },
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
        });

        const node2 = await db.nodes.add({
            type: 'paper',
            url: 'https://arxiv.org/abs/1810.04805',
            title: 'BERT: Pre-training of Deep Bidirectional Transformers',
            summary: 'BERT introduced bidirectional pre-training for language understanding, achieving state-of-the-art results on multiple NLP benchmarks through masked language modeling.',
            structuredData: {
                'Authors': ['Devlin', 'Chang', 'Lee', 'Toutanova'],
                'Year': '2018',
                'Key Contribution': 'Bidirectional Pre-training',
                'Based On': 'Transformer'
            },
            createdAt: new Date('2024-02-10'),
            updatedAt: new Date('2024-02-10')
        });

        const node3 = await db.nodes.add({
            type: 'paper',
            url: 'https://arxiv.org/abs/2005.14165',
            title: 'GPT-3: Language Models are Few-Shot Learners',
            summary: 'GPT-3 demonstrated that scaling language models to 175B parameters enables few-shot learning without fine-tuning, showing emergent capabilities across diverse tasks.',
            structuredData: {
                'Authors': ['Brown et al.'],
                'Year': '2020',
                'Parameters': '175B',
                'Key Contribution': 'Few-shot Learning at Scale'
            },
            createdAt: new Date('2024-03-05'),
            updatedAt: new Date('2024-03-05')
        });

        const node4 = await db.nodes.add({
            type: 'paper',
            url: 'https://arxiv.org/abs/2203.02155',
            title: 'Chain-of-Thought Prompting',
            summary: 'Chain-of-thought prompting elicits reasoning in large language models by encouraging them to generate intermediate reasoning steps, dramatically improving performance on complex tasks.',
            structuredData: {
                'Authors': ['Wei et al.'],
                'Year': '2022',
                'Key Contribution': 'Reasoning through Prompting',
                'Improves': 'Complex Reasoning Tasks'
            },
            createdAt: new Date('2024-04-20'),
            updatedAt: new Date('2024-04-20')
        });

        const node5 = await db.nodes.add({
            type: 'paper',
            url: 'https://arxiv.org/abs/2307.09288',
            title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models',
            summary: 'Llama 2 provides open-source foundation models ranging from 7B to 70B parameters, trained on 2 trillion tokens, with fine-tuned chat variants optimized for dialogue.',
            structuredData: {
                'Authors': ['Meta AI'],
                'Year': '2023',
                'Parameters': '7B - 70B',
                'Type': 'Open Source Foundation Model'
            },
            createdAt: new Date('2024-05-15'),
            updatedAt: new Date('2024-05-15')
        });

        // Create links between related papers
        await db.links.add({
            sourceId: node2 as number,
            targetId: node1 as number,
            reason: 'BERT builds upon the Transformer architecture',
            createdAt: new Date(),
            type: 'manual'
        });

        await db.links.add({
            sourceId: node3 as number,
            targetId: node1 as number,
            reason: 'GPT-3 uses Transformer decoder architecture',
            createdAt: new Date(),
            type: 'manual'
        });

        await db.links.add({
            sourceId: node4 as number,
            targetId: node3 as number,
            reason: 'Chain-of-thought prompting enhances GPT-3 reasoning',
            createdAt: new Date(),
            type: 'manual'
        });

        await db.links.add({
            sourceId: node5 as number,
            targetId: node1 as number,
            reason: 'Llama 2 based on Transformer architecture',
            createdAt: new Date(),
            type: 'manual'
        });

        console.log("Mock data added successfully! 5 nodes and 4 links created.");
    };
}