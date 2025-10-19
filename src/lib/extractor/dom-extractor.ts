import type { PageContent } from '../types';

/**
 * This function runs in page context (injected via chrome.scripting.executeScript)
 * and extracts useful pieces of content from the DOM. It returns a PageContent
 * object that will be serialized and sent back to the extension background.
 *
 * Note: This function must only rely on browser globals and DOM APIs since it
 * executes inside the target page (not the extension's context).
 */
export function extractPageContentFromDOM(): PageContent {
    const title = document.title;
    const metaDescription = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || "";

    // Extract headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent?.trim())
        .filter((text): text is string => Boolean(text));

    // Extract links
    const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href.startsWith('http'));

    // Extract images
    const images = Array.from(document.querySelectorAll('img[src]'))
        .map(img => (img as HTMLImageElement).src)
        .filter(src => src.startsWith('http'));

    // Extract main content
    let content = "";
    let fullText = "";

    // Try to find main content areas
    const mainContent = document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('.content') ||
        document.querySelector('#content') ||
        document.body;

    if (mainContent) {
        fullText = mainContent.textContent?.trim() || "";

        // Extract first few paragraphs as content summary
        const paragraphs = Array.from(mainContent.querySelectorAll('p'))
            .map(p => p.textContent?.trim())
            .filter((text): text is string => Boolean(text) && text.length > 50)
            .slice(0, 3);

        content = paragraphs.join('\n\n');
    }

    if (!fullText) {
        fullText = document.body.textContent?.trim() || "";
    }

    return {
        title,
        url: window.location.href,
        content,
        fullText,
        metaDescription,
        headings,
        links: links.slice(0, 10), // Limit to first 10 links
        images: images.slice(0, 5)  // Limit to first 5 images
    };
}