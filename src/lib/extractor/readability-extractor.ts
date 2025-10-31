import { PageContent } from '../types';
import { Readability } from '@mozilla/readability';

/**
 * Extract structured content using Mozilla's Readability library
 * Converts to standardized PageContent format
 * 
 * Parses the document to extract the main article content, metadata, images, headings, and links.
 * Creates a clone to avoid modifying the original DOM.
 * 
 * @returns {PageContent | null} Standardized page content
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
    const article = reader.parse();

    if (!article) return null;

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

    // Determine content type based on article length and structure
    const contentType = article.length && article.length > 3000 ? 'article' : 'generic';

    return {
        title: article.title || originalTitle,
        url: "", // Filled by the caller
        fullText: article.textContent || "",

        metadata: {
            description: article.excerpt || metaDescription || undefined,
            contentType,
            tags: headings,
        },

        images: [...new Set(images)],
        links: [...new Set(links)],

        extractorType: 'readability'
    };
}