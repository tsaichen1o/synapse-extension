// src/lib/db.ts
import Dexie, { type EntityTable } from "dexie";

// 假設你已經安裝了 dexie: npm install dexie
// 如果還沒安裝，請執行 npm install dexie

// Define interfaces for our database tables
export interface SynapseNode {
    id?: number;
    type: string;
    url: string;
    title: string;
    createdAt: Date;
    summary?: string;
    structuredData?: Record<string, any>;
    chatHistory?: Array<{ sender: "user" | "ai"; text: string }>;
}

export interface SynapseLink {
    id?: number;
    sourceId: number;
    targetId: number;
    reason: string;
    createdAt: Date;
}

// Define the database schema
export interface SynapseDatabase extends Dexie {
    nodes: EntityTable<SynapseNode, 'id'>;
    links: EntityTable<SynapseLink, 'id'>;
}

export const db = new Dexie("SynapseKnowledgeBase") as SynapseDatabase;

db.version(1).stores({
    nodes: "++id, type, url, title, createdAt", // 主要的節點表
    links: "++id, sourceId, targetId, reason, createdAt", // 連結表
});

// 在開發模式下，你可以導出一些方便的函式來清空資料庫
if (import.meta.env?.DEV) {
    (window as any).clearSynapseDB = (): void => {
        db.nodes.clear();
        db.links.clear();
        console.log("Synapse database cleared!");
    };
}