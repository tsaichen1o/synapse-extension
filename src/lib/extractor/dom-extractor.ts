import type { PageContent } from '../types';

/**
 * Extract page content from DOM - generic fallback extractor
 * This function runs in page context (injected via chrome.scripting.executeScript)
 * 
 * Converts extracted content to standardized PageContent format
 * Note: This function must only rely on browser globals and DOM APIs since it
 * executes inside the target page (not the extension's context).
 */
export function extractPageContentFromDOM(): PageContent {
    const title = document.title;
    const description = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || "";

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
    const mainContent = document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('.content') ||
        document.querySelector('#content') ||
        document.body;

    const fullText = mainContent?.textContent?.trim() || document.body.textContent?.trim() || "";

    // Extract first few paragraphs as short content
    const paragraphs = Array.from((mainContent || document.body).querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter((text): text is string => Boolean(text));

    const shortContent = paragraphs.join('\n\n');

    return {
        title,
        url: window.location.href,
        fullText,

        metadata: {
            description,
            contentType: 'generic',
            tags: headings,
        },

        links: links,
        images: images,
    };
}
