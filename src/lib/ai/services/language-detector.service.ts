import { AIErrors } from '../../errors';
import type {
    LanguageDetectionRequestOptions,
    LanguageDetectionResult,
    LanguageDetectorSession
} from '../../types';

/**
 * Wrapper around Chrome's Language Detector API with lazy initialization.
 */
export class LanguageDetectorService {
    private detector?: LanguageDetectorSession;
    private detectorPromise?: Promise<LanguageDetectorSession>;

    /**
     * Detect likely languages for the provided text using the on-device model.
     */
    async detect(text: string, options?: LanguageDetectionRequestOptions): Promise<LanguageDetectionResult[]> {
        const trimmed = text.trim();
        if (!trimmed) {
            return [];
        }

        const detector = await this.ensureDetector(options);
        try {
            return await detector.detect(trimmed);
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.languageDetectionFailed(aiError);
        }
    }

    /**
     * Reset the underlying detector so it can be re-created on the next request.
     */
    reset(): void {
        this.releaseDetector();
    }

    private async ensureDetector(options?: LanguageDetectionRequestOptions): Promise<LanguageDetectorSession> {
        if (!window.LanguageDetector) {
            throw AIErrors.languageDetectorNotAvailable();
        }

        if (options?.forceReload) {
            this.releaseDetector();
        }

        if (this.detector) {
            return this.detector;
        }

        if (!this.detectorPromise) {
            const availability = await window.LanguageDetector.availability();
            if (availability === 'unavailable') {
                throw AIErrors.languageDetectorNotAvailable();
            }

            this.detectorPromise = window.LanguageDetector.create({
                monitor: options?.monitor,
                signal: options?.signal,
            }).then(detector => {
                this.detector = detector;
                return detector;
            }).catch(error => {
                this.detectorPromise = undefined;
                const aiError = error instanceof Error ? error : new Error(String(error));
                throw AIErrors.languageDetectionFailed(aiError);
            });
        }

        return this.detectorPromise;
    }

    private releaseDetector(): void {
        if (this.detector && typeof this.detector.destroy === 'function') {
            try {
                this.detector.destroy();
            } catch (error) {
                console.warn('Failed to destroy language detector session', error);
            }
        }

        this.detector = undefined;
        this.detectorPromise = undefined;
    }
}
