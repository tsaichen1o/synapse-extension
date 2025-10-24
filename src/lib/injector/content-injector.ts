import { extractPageContentWithReadability, extractPageContentFromDOM } from '../extractor';

/**
 * Injects content extraction logic into the current page context for helper.ts
 * to retrieve structured page content.
 */
(function () {
    return extractPageContentWithReadability() || extractPageContentFromDOM();
})();