import { PageContent } from './types';
import { extractPageContentFromDOM } from './extractor';

/**
 * Extracts page content from the currently active tab by injecting a DOM
 * extraction script and returning a normalized PageContent object.
 *
 * Errors:
 * - Rejects if there is no active tab
 * - Rejects if script injection fails (chrome.runtime.lastError)
 */
export async function getPageContent(): Promise<PageContent> {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
            const tab = tabs[0];
            if (!tab?.id) {
                reject(new Error("No active tab found"));
                return;
            }

            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: extractPageContentFromDOM,
                },
                (results: chrome.scripting.InjectionResult[]) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (results && results[0] && results[0].result) {
                        const content = results[0].result as PageContent;
                        content.url = tab.url || "";
                        content.title = content.title || tab.title || "";
                        resolve(content);
                    } else {
                        reject(new Error("Failed to extract page content"));
                    }
                }
            );
        });
    });
}