import type { PageContent, AIMessage, AIContentPart } from '../../types';
import type { AI } from '../ai';
/**
 * Handles image processing and multimodal context creation for AI sessions.
 * Supports fetching, validating (PNG/JPEG only), and converting images to AI-compatible formats.
 */
export class ImageService {
    constructor(private ai: AI) { }

    /** Maximum number of images to process per page */
    private readonly MAX_IMAGES = 5;


    /**
     * Converts a data URL to a Blob. Only accepts PNG and JPEG formats.
     */
    dataUrlToBlob(dataUrl: string): Blob | null {
        try {
            const parts = dataUrl.split(',');
            if (parts.length !== 2) return null;

            const mimeMatch = parts[0].match(/:(.*?);/);
            if (!mimeMatch || mimeMatch.length < 2) return null;

            const mime = mimeMatch[1];

            // *** FILTER POINT 1: Check MIME type in data URL ***
            if (mime !== 'image/png' && mime !== 'image/jpeg') {
                console.warn(`Skipping data URL with unsupported type: ${mime}`);
                return null;
            }

            const byteString = atob(parts[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], { type: mime });

        } catch (error) {
            console.error("Error converting data URL to blob:", error);
            return null;
        }
    }

    /**
     * Fetches an image as a Blob. Only accepts PNG and JPEG formats.
     * Supports data URLs, HTTP(S), and blob URLs.
     */
    async fetchImageAsBlob(imageUrl: string): Promise<Blob | null> {
        try {
            if (imageUrl.startsWith('data:image/')) {
                return this.dataUrlToBlob(imageUrl);
            }

            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('blob:')) {
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    console.warn(`Failed to fetch image (${response.status}): ${imageUrl}`);
                    return null;
                }

                const contentType = response.headers.get('content-type');
                if (!contentType) {
                    console.warn(`Missing content-type for: ${imageUrl}`);
                    return null;
                }

                const mimeType = contentType.split(';')[0].trim();

                if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
                    return await response.blob();
                } else {
                    console.log(`Skipping unsupported image type: ${mimeType} for URL: ${imageUrl}`);
                    return null;
                }
            }

            console.warn(`Skipping unsupported URL scheme: ${imageUrl}`);
            return null;

        } catch (error) {
            console.error(`Error fetching image ${imageUrl}:`, error);
            return null;
        }
    }

    /**
     * Processes and appends page images to the AI session as multimodal context.
     * Validates and limits images to MAX_IMAGES.
     */
    async appendImageContext(pageContent: PageContent): Promise<void> {
        const images = pageContent.images || [];
        const imageContents: AIContentPart[] = [];
        for (const imageUrl of images) {
            const blob = await this.fetchImageAsBlob(imageUrl);
            if (blob) {
                imageContents.push({
                    type: "image",
                    value: blob
                });
            }
        }

        if (imageContents.length === 0) {
            console.warn("📷 No valid images could be processed");
            return;
        }
        console.log(`📷 Appending ${Math.min(imageContents.length, this.MAX_IMAGES)} image(s) to AI session context`);

        const message: AIMessage = {
            role: "user",
            content: [
                {
                    type: "text",
                    value: `Here are ${imageContents.length} image(s) from the page "${pageContent.title}". These images provide visual context for the content. Use them to enhance your understanding when summarizing or answering questions.`
                },
                ...imageContents.slice(0, this.MAX_IMAGES)
            ]
        };
        return this.ai.getNativeSession().append([message]);
    }
}
