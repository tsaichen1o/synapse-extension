import { AIErrors } from '../../errors';
import type {
    TranslationRequestOptions,
    TranslatorSession
} from '../../types';

/**
 * Translator service that caches on-device translators by language pair.
 */
export class TranslatorService {
    private readonly translators = new Map<string, TranslatorSession>();
    private readonly translatorPromises = new Map<string, Promise<TranslatorSession>>();

    /**
     * Translate text using a cached translator for the specified language pair.
     */
    async translate(text: string, options: TranslationRequestOptions): Promise<string> {
        this.assertOptions(options);
        const translator = await this.ensureTranslator(options);

        try {
            return await translator.translate(text);
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.translationFailed(aiError);
        }
    }

    /**
     * Translate text while streaming chunks to an optional callback.
     */
    async translateStreaming(
        text: string,
        options: TranslationRequestOptions,
        onChunk?: (chunk: string) => void
    ): Promise<string> {
        this.assertOptions(options);
        const translator = await this.ensureTranslator(options);

        try {
            const streamOrPromise = translator.translateStreaming(text);
            const stream = streamOrPromise instanceof ReadableStream
                ? streamOrPromise
                : await streamOrPromise;

            const reader = stream.getReader();
            let fullTranslation = '';
            const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : undefined;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = this.normalizeChunk(value, decoder);
                    if (!chunk) continue;

                    fullTranslation += chunk;
                    if (onChunk) {
                        onChunk(chunk);
                    }
                }
            } finally {
                reader.releaseLock();
            }

            if (decoder) {
                const remaining = decoder.decode();
                if (remaining) {
                    fullTranslation += remaining;
                    if (onChunk) {
                        onChunk(remaining);
                    }
                }
            }

            return fullTranslation;
        } catch (error) {
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.translationFailed(aiError);
        }
    }

    /**
     * Flush all cached translators.
     */
    reset(): void {
        for (const key of this.translators.keys()) {
            this.releaseTranslator(key);
        }

        this.translators.clear();
        this.translatorPromises.clear();
    }

    private assertOptions(options: TranslationRequestOptions): void {
        if (!options?.sourceLanguage || !options?.targetLanguage) {
            throw AIErrors.translationFailed(new Error('Both sourceLanguage and targetLanguage are required.'));
        }
    }

    private async ensureTranslator(options: TranslationRequestOptions): Promise<TranslatorSession> {
        if (!window.Translator) {
            throw AIErrors.translatorNotAvailable(options.sourceLanguage, options.targetLanguage);
        }

        const key = this.getCacheKey(options.sourceLanguage, options.targetLanguage);

        if (options.forceReload) {
            this.releaseTranslator(key);
            this.translatorPromises.delete(key);
        }

        const cached = this.translators.get(key);
        if (cached) {
            return cached;
        }

        const inFlight = this.translatorPromises.get(key);
        if (inFlight) {
            return inFlight;
        }

        const availability = await window.Translator.availability({
            sourceLanguage: options.sourceLanguage,
            targetLanguage: options.targetLanguage,
        });

        if (availability === 'unavailable') {
            throw AIErrors.translatorNotAvailable(options.sourceLanguage, options.targetLanguage);
        }

        const creation = window.Translator.create({
            sourceLanguage: options.sourceLanguage,
            targetLanguage: options.targetLanguage,
            monitor: options.monitor,
            signal: options.signal,
        }).then(translator => {
            this.translators.set(key, translator);
            return translator;
        }).catch(error => {
            this.translatorPromises.delete(key);
            const aiError = error instanceof Error ? error : new Error(String(error));
            throw AIErrors.translationFailed(aiError);
        });

        this.translatorPromises.set(key, creation);
        const translator = await creation;
        this.translatorPromises.delete(key);
        return translator;
    }

    private normalizeChunk(value: unknown, decoder?: TextDecoder): string | undefined {
        if (typeof value === 'string') {
            return value;
        }

        if (value instanceof Uint8Array) {
            if (!decoder) {
                return String.fromCharCode(...value);
            }

            return decoder.decode(value, { stream: true });
        }

        if (Array.isArray(value)) {
            return value.join('');
        }

        return typeof value === 'number' ? String(value) : undefined;
    }

    private releaseTranslator(key: string): void {
        const translator = this.translators.get(key);
        if (!translator) {
            return;
        }

        this.translators.delete(key);

        const destroy = (translator as unknown as { destroy?: () => void; close?: () => void; }).destroy
            ?? (translator as unknown as { close?: () => void; }).close;

        if (typeof destroy === 'function') {
            try {
                destroy.call(translator);
            } catch (error) {
                console.warn(`Failed to destroy translator for ${key}`, error);
            }
        }
    }

    private getCacheKey(source: string, target: string): string {
        return `${source.toLowerCase()}->${target.toLowerCase()}`;
    }
}
