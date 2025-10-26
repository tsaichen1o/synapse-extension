/**
 * Injects content extraction logic into the current page context
 * 
 * Extraction priority:
 * 1. arXiv Abstract page (specialized extractor for paper metadata)
 * 2. arXiv HTML (specialized extractor for full research papers)
 * 3. Readability (general purpose, works well on articles)
 * 4. DOM extraction (fallback)
 * 
 * All extractors now return standardized PageContent format
 * The last expression is returned as the script result to chrome.scripting.executeScript
 */

import {
    extractPageContentWithReadability,
    extractPageContentFromDOM,
    extractArxivPaper,
    extractArxivAbstract
} from '.';

(function () {
    // Try arXiv abstract extractor first (for https://arxiv.org/abs/xxxx.xxxxx)
    const arxivAbstractContent = extractArxivAbstract(document);
    if (arxivAbstractContent) {
        console.log("📑 arXiv abstract page detected - using specialized extractor");
        return arxivAbstractContent;
    }

    // Try arXiv HTML paper extractor (for https://arxiv.org/html/xxxx.xxxxx)
    const arxivContent = extractArxivPaper(document);
    if (arxivContent) {
        console.log("📚 arXiv HTML paper detected - using specialized extractor");
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
