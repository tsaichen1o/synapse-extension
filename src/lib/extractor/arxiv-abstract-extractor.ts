/**
 * ArxivAbstractExtractor - Specialized extractor for arXiv Abstract pages
 * 
 * ArXiv Abstract page structure (https://arxiv.org/abs/xxxx.xxxxx):
 * - Title: <h1 class="title mathjax">
 * - Authors: <div class="authors">
 * - Abstract: <blockquote class="abstract mathjax">
 * - Subjects: <td class="tablecell subjects">
 * - Comments: <td class="tablecell comments">
 * - DOI: <a id="arxiv-doi-link">
 * - Submission history: <div class="submission-history">
 * 
 * This extractor:
 * 1. Extracts arXiv abstract page metadata
 * 2. Converts to standardized PageContent format
 * 3. Provides quick access to paper information without downloading full HTML
 */

import { PageContent } from '../types';

/**
 * Extract arXiv abstract page and convert to standardized PageContent
 * This is the main entry point for the arXiv abstract extractor
 */
export function extractArxivAbstract(doc: Document): PageContent | null {
    if (!isArxivAbstractPage(doc)) {
        return null;
    }

    const title = extractTitle(doc);
    const authors = extractAuthors(doc);
    const abstract = extractAbstract(doc);
    const metadata = extractMetadata(doc);
    const arxivId = extractArxivId(doc);
    const doi = extractDOI(doc);
    const submissionHistory = extractSubmissionHistory(doc);

    // Extract tags from subjects
    const tags = metadata.subjects || [];

    return {
        title,
        url: window.location.href,
        fullText: `# ${title}\n\n## Authors\n${authors.join(', ')}\n\n## Abstract\n${abstract}`,

        metadata: {
            authors,
            contentType: 'research-paper',
            tags,
            description: abstract,
            publishDate: submissionHistory.submittedDate,
            subjects: metadata.subjects,
            extra: {
                arxivId,
                doi,
                comments: metadata.comments,
                mscClass: metadata.mscClass,
                acmClass: metadata.acmClass,
                journalRef: metadata.journalRef,
                submissionHistory: submissionHistory.versions,
            }
        },

        images: [],
        links: [
            `https://arxiv.org/pdf/${arxivId}`,
            `https://arxiv.org/html/${arxivId}`
        ],

        extractorType: 'arxiv'
    };
}

/**
 * Extract title from arXiv abstract page
 * Pattern: <h1 class="title mathjax"><span class="descriptor">Title:</span>...</h1>
 */
function extractTitle(doc: Document): string {
    const titleElement = doc.querySelector('h1.title.mathjax');
    if (!titleElement) return 'Untitled';

    // Remove the "Title:" descriptor
    const descriptorElement = titleElement.querySelector('span.descriptor');
    if (descriptorElement) {
        descriptorElement.remove();
    }

    return titleElement.textContent?.trim() || 'Untitled';
}

/**
 * Extract authors from arXiv abstract page
 * Pattern: <div class="authors"><span class="descriptor">Authors:</span><a>Author Name</a>, ...</div>
 */
function extractAuthors(doc: Document): string[] {
    const authors: string[] = [];
    const authorsElement = doc.querySelector('div.authors');

    if (!authorsElement) return authors;

    // Get all author links
    const authorLinks = authorsElement.querySelectorAll('a');
    authorLinks.forEach(link => {
        const authorName = link.textContent?.trim();
        if (authorName) {
            authors.push(authorName);
        }
    });

    return authors;
}

/**
 * Extract abstract from arXiv abstract page
 * Pattern: <blockquote class="abstract mathjax"><span class="descriptor">Abstract:</span>...</blockquote>
 */
function extractAbstract(doc: Document): string {
    const abstractElement = doc.querySelector('blockquote.abstract.mathjax');
    if (!abstractElement) return '';

    // Clone the element to avoid modifying the original
    const clonedElement = abstractElement.cloneNode(true) as Element;

    // Remove the "Abstract:" descriptor
    const descriptorElement = clonedElement.querySelector('span.descriptor');
    if (descriptorElement) {
        descriptorElement.remove();
    }

    return clonedElement.textContent?.trim() || '';
}

/**
 * Extract arXiv ID from the page
 * Pattern: URL like https://arxiv.org/abs/2510.15870 or from breadcrumbs
 */
function extractArxivId(doc: Document): string {
    // Try to extract from URL
    const urlMatch = window.location.href.match(/arxiv\.org\/abs\/([\d\.]+(?:v\d+)?)/);
    if (urlMatch) {
        return urlMatch[1];
    }

    // Try to extract from breadcrumbs
    const breadcrumbs = doc.querySelector('.header-breadcrumbs, .header-breadcrumbs-mobile');
    if (breadcrumbs) {
        const text = breadcrumbs.textContent || '';
        const idMatch = text.match(/arXiv:([\d\.]+(?:v\d+)?)/);
        if (idMatch) {
            return idMatch[1];
        }
    }

    return '';
}

/**
 * Extract DOI if available
 * Pattern: <a href="https://doi.org/..." id="arxiv-doi-link">
 */
function extractDOI(doc: Document): string | undefined {
    const doiLink = doc.querySelector('a#arxiv-doi-link');
    if (!doiLink) return undefined;

    const href = (doiLink as HTMLAnchorElement).href;
    const doiMatch = href.match(/doi\.org\/(10\.\d+\/.*)/);
    if (doiMatch) {
        return doiMatch[1];
    }

    return undefined;
}

/**
 * Extract metadata from the metatable
 */
function extractMetadata(doc: Document): {
    subjects?: string[];
    comments?: string;
    mscClass?: string;
    acmClass?: string;
    journalRef?: string;
} {
    const metadata: {
        subjects?: string[];
        comments?: string;
        mscClass?: string;
        acmClass?: string;
        journalRef?: string;
    } = {};

    // Extract subjects
    const subjectsCell = doc.querySelector('td.tablecell.subjects');
    if (subjectsCell) {
        const subjectsText = subjectsCell.textContent || '';
        // Parse subjects - primary subject is in <span class="primary-subject">
        const subjects: string[] = [];

        const primarySubject = subjectsCell.querySelector('span.primary-subject');
        if (primarySubject) {
            subjects.push(cleanSubject(primarySubject.textContent || ''));
        }

        // Parse remaining subjects from text
        const remainingText = subjectsText.replace(primarySubject?.textContent || '', '');
        const otherSubjects = remainingText
            .split(';')
            .map(s => cleanSubject(s))
            .filter(s => s && !subjects.includes(s));

        subjects.push(...otherSubjects);
        metadata.subjects = subjects;
    }

    // Extract comments
    const commentsCell = doc.querySelector('td.tablecell.comments');
    if (commentsCell) {
        metadata.comments = commentsCell.textContent?.trim();
    }

    // Extract MSC-class
    const mscClassCell = doc.querySelector('td.tablecell.msc-classes');
    if (mscClassCell) {
        metadata.mscClass = mscClassCell.textContent?.trim();
    }

    // Extract ACM-class
    const acmClassCell = doc.querySelector('td.tablecell.acm-classes');
    if (acmClassCell) {
        metadata.acmClass = acmClassCell.textContent?.trim();
    }

    // Extract journal reference
    const journalRefCell = doc.querySelector('td.tablecell.jref');
    if (journalRefCell) {
        metadata.journalRef = journalRefCell.textContent?.trim();
    }

    return metadata;
}

/**
 * Clean subject string by removing category codes in parentheses
 * Example: "Computer Vision and Pattern Recognition (cs.CV)" -> "Computer Vision and Pattern Recognition"
 */
function cleanSubject(subject: string): string {
    return subject
        .replace(/\s*\([^)]+\)\s*/g, '') // Remove parentheses and content
        .trim();
}

/**
 * Extract submission history
 * Pattern: <div class="submission-history">
 */
function extractSubmissionHistory(doc: Document): {
    submittedDate?: string;
    versions: Array<{
        version: string;
        date: string;
        size?: string;
    }>;
} {
    const history: {
        submittedDate?: string;
        versions: Array<{
            version: string;
            date: string;
            size?: string;
        }>;
    } = {
        versions: []
    };

    const historyElement = doc.querySelector('div.submission-history');
    if (!historyElement) return history;

    const text = historyElement.textContent || '';

    // Extract all versions
    // Pattern: [v1] Fri, 17 Oct 2025 17:59:59 UTC (18,945 KB)
    const versionMatches = text.matchAll(/\[v(\d+)\]\s*([^\(]+)\s*(?:\(([^)]+)\))?/g);

    for (const match of versionMatches) {
        const version = match[1];
        const date = match[2].trim();
        const size = match[3]?.trim();

        history.versions.push({
            version: `v${version}`,
            date,
            size
        });

        // First version is the submission date
        if (version === '1') {
            history.submittedDate = date;
        }
    }

    return history;
}

/**
 * Check if a document is an arXiv abstract page
 */
function isArxivAbstractPage(doc: Document): boolean {
    // Check for distinctive elements of arXiv abstract pages
    const hasAbstract = doc.querySelector('blockquote.abstract.mathjax') !== null;
    const hasAuthors = doc.querySelector('div.authors') !== null;
    const hasTitle = doc.querySelector('h1.title.mathjax') !== null;
    const isAbsUrl = window.location.href.includes('arxiv.org/abs/');

    return (hasAbstract || hasAuthors || hasTitle) && isAbsUrl;
}
