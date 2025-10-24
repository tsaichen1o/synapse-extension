import { PageContent } from '../types';
import { Readability } from '@mozilla/readability';


/**
 * Extracts structured content from the current DOM using Mozilla's Readability library.
 * 
 * Parses the document to extract the main article content, metadata, images, headings, and links.
 * Creates a clone to avoid modifying the original DOM.
 * 
 * @returns {PageContent | null} Extracted page content including title, content, fullText, images, headings, and links.
 * Returns `null` if parsing fails.
 * 
 * @remarks Must be executed in a browser context. The `url` property should be set by the caller.
 */
export function extractPageContentWithReadability(): PageContent | null {
    const metaDescElement = document.querySelector('meta[name="description"]');
    const metaDescription = metaDescElement ? metaDescElement.getAttribute('content') : undefined;
    const originalTitle = document.title;
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse(); if (!article) return null;

    let images: string[] = [];
    let headings: string[] = [];
    let links: string[] = [];

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content || "";

    images = Array.from(tempDiv.querySelectorAll('img'))
        .map(img => img.src)
        .filter(Boolean);

    headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent || "")
        .filter(Boolean);

    links = Array.from(tempDiv.querySelectorAll('a'))
        .map(a => a.href)
        .filter(Boolean);

    const content: PageContent = {
        title: article.title || originalTitle,
        url: "", // Filled by the caller
        content: article.content || undefined,
        abstract: article.excerpt || undefined,
        fullText: article.textContent || "",
        metaDescription: metaDescription || undefined,
        images: [...new Set(images)],
        headings: [...new Set(headings)],
        links: [...new Set(links)],
    };

    return content;
}