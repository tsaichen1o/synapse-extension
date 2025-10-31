/**
 * Utility functions for cleaning and processing AI model outputs
 */

/**
 * Safely stringifies values in structured data to prevent [object Object] display
 * Handles arrays, objects, and primitive values appropriately
 * 
 * @param value - Any value from structured data
 * @returns Human-readable string representation
 */
export function stringifyStructuredValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        // Handle array of primitives
        if (value.every(item => typeof item !== 'object' || item === null)) {
            return value.join(', ');
        }
        // Handle array of objects
        return value.map(item => stringifyStructuredValue(item)).join(', ');
    }

    if (typeof value === 'object') {
        // For objects, create a readable key-value representation
        return Object.entries(value)
            .map(([k, v]) => `${k}: ${stringifyStructuredValue(v)}`)
            .join('; ');
    }

    return String(value);
}

/**
 * Normalizes structured data to ensure all values are properly formatted
 * This prevents [object Object] issues when displaying data
 * 
 * @param data - Raw structured data from AI response
 * @returns Normalized structured data with properly formatted values
 */
export function normalizeStructuredData(data: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
        const normalizedValue = normalizeStructuredValue(value);
        if (normalizedValue !== undefined) {
            normalized[key] = normalizedValue;
        }
    });

    return normalized;
}

type ArrayPrimitive = string | number | boolean | Date;

function normalizeStructuredValue(value: unknown): unknown | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value)) {
        const collected: ArrayPrimitive[] = [];

        value.forEach(item => {
            const normalizedItem = normalizeArrayValue(item);

            if (Array.isArray(normalizedItem)) {
                normalizedItem.forEach(entry => collected.push(entry));
            } else if (normalizedItem !== undefined) {
                collected.push(normalizedItem);
            }
        });

        return collected.length > 0 ? collected : undefined;
    }

    if (typeof value === 'object') {
        const stringified = stringifyStructuredValue(value).trim();
        return stringified.length > 0 ? stringified : undefined;
    }

    return undefined;
}

function normalizeArrayValue(value: unknown): ArrayPrimitive | ArrayPrimitive[] | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value)) {
        const nested: ArrayPrimitive[] = [];
        value.forEach(item => {
            const normalizedItem = normalizeArrayValue(item);
            if (Array.isArray(normalizedItem)) {
                normalizedItem.forEach(entry => nested.push(entry));
            } else if (normalizedItem !== undefined) {
                nested.push(normalizedItem);
            }
        });
        return nested.length > 0 ? nested : undefined;
    }

    if (typeof value === 'object') {
        const text = stringifyStructuredValue(value).trim();
        return text.length > 0 ? text : undefined;
    }

    return undefined;
}
