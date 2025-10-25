/**
 * Injects content extraction logic into the current page context
 * 
 * Extraction priority:
 * 1. arXiv HTML (specialized extractor for research papers)
 * 2. Readability (general purpose, works well on articles)
 * 3. DOM extraction (fallback)
 * 
 * All extractors now return standardized PageContent format
 * The last expression is returned as the script result to chrome.scripting.executeScript
 */

import { extractPageContentWithReadability, extractPageContentFromDOM, extractArxivPaper } from '../extractor';

(function () {
    // Try arXiv extractor first
    const arxivContent = extractArxivPaper(document);
    if (arxivContent) {
        console.log("📚 arXiv paper detected - using specialized extractor");
        return arxivContent;
    }

    // Try Readability extractor
    const readabilityContent = extractPageContentWithReadability();
    if (readabilityContent) {
        console.log("📰 Using Readability extractor");
        readabilityContent.url = window.location.href;
        return readabilityContent;
    }

    // Fallback to DOM extractor
    console.log("🔍 Using generic DOM extractor");
    const domContent = extractPageContentFromDOM();
    domContent.url = window.location.href;
    return domContent;
})();
