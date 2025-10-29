// src/lib/graph-utils.ts
import { db } from './db';
import type { SynapseNode } from './types';

const SIMILARITY_THRESHOLD = 0.2; // Lowered threshold for more connections

/**
 * Extracts a set of significant keywords from a node's summary and structured data.
 * @param text The node's summary text.
 * @param structuredData The node's key-value structured data.
 * @returns A Set of unique keywords.
 */
export const extractKeywords = (text: string, structuredData: Record<string, unknown>): Set<string> => {
    const keywords = new Set<string>();
    const stopWords = new Set(['the', 'a', 'an', 'in', 'is', 'of', 'and', 'to', 'for', 'from', 'on', 'with', 'as', 'by']);

    // Function to process and add words to the keyword set
    const processText = (inputText: string) => {
        if (!inputText) return;
        const words = inputText.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word)); // Filter short words and stop words
        words.forEach(word => keywords.add(word));
    };

    processText(text);

    Object.values(structuredData).forEach(value => {
        if (typeof value === 'string') {
            processText(value);
        } else if (Array.isArray(value)) {
            value.forEach(item => {
                if (typeof item === 'string') {
                    processText(item);
                }
            });
        }
    });

    return keywords;
};

/**
 * Calculates the Jaccard similarity between two sets of keywords.
 * @param keywords1 First set of keywords.
 * @param keywords2 Second set of keywords.
 * @returns A similarity score between 0 and 1.
 */
const calculateSimilarity = (keywords1: Set<string>, keywords2: Set<string>): number => {
    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);
    return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Finds the top common keywords between two sets.
 * @param keywords1 First set of keywords.
 * @param keywords2 Second set of keywords.
 * @returns An array of the top 3 common keywords.
 */
const findCommonKeywords = (keywords1: Set<string>, keywords2: Set<string>): string[] => {
    return [...keywords1].filter(k => keywords2.has(k)).slice(0, 3);
};

/**
 * Re-evaluates and updates all automatic links for a given node based on content similarity.
 * It adds new links for nodes that have become similar and removes links for those that are no longer similar.
 * @param nodeId The ID of the node to update links for.
 * @param nodeData The full data of the node.
 */
export const updateAutoLinks = async (nodeId: number, nodeData: SynapseNode): Promise<void> => {
    console.log(`Re-evaluating auto-links for node: ${nodeId}`);

    try {
        const allNodes = await db.nodes.toArray();
        const otherNodes = allNodes.filter(node => node.id !== nodeId);

        if (otherNodes.length === 0) {
            console.log("No other nodes to link with.");
            return;
        }

        const currentKeywords = extractKeywords(nodeData.summary || '', nodeData.structuredData || {});

        for (const otherNode of otherNodes) {
            if (!otherNode.id) continue;

            const otherKeywords = extractKeywords(otherNode.summary || '', otherNode.structuredData || {});
            const similarity = calculateSimilarity(currentKeywords, otherKeywords);

            // Check if a link already exists in either direction
            const existingLink = await db.links
                .filter(link =>
                    (link.sourceId === nodeId && link.targetId === otherNode.id) ||
                    (link.sourceId === otherNode.id && link.targetId === nodeId)
                )
                .first();

            if (similarity > SIMILARITY_THRESHOLD) {
                // Add link if it doesn't exist
                if (!existingLink) {
                    const commonKeywords = findCommonKeywords(currentKeywords, otherKeywords);
                    if (commonKeywords.length > 0) {
                        await db.links.add({
                            sourceId: nodeId,
                            targetId: otherNode.id,
                            reason: `Related topics: ${commonKeywords.join(', ')}`,
                            createdAt: new Date(),
                            type: 'auto' // Mark as an auto-generated link
                        });
                        console.log(`Created new auto-link between ${nodeId} and ${otherNode.id} (Similarity: ${similarity.toFixed(2)})`);
                    }
                }
            } else {
                // Remove link if it exists and was auto-generated
                if (existingLink && existingLink.type === 'auto') {
                    await db.links.delete(existingLink.id!);
                    console.log(`Removed auto-link between ${nodeId} and ${otherNode.id} (Similarity dropped to: ${similarity.toFixed(2)})`);
                }
            }
        }
    } catch (error) {
        console.error("Error updating auto-links:", error);
    }
};
