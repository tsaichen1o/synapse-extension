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
        return value;
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

    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
            // Preserve null/undefined values
            normalized[key] = value;
        } else if (Array.isArray(value)) {
            // Keep arrays as arrays, but ensure items are properly formatted
            normalized[key] = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return stringifyStructuredValue(item);
                }
                return item;
            });
        } else if (typeof value === 'object') {
            // Convert nested objects to readable strings
            normalized[key] = stringifyStructuredValue(value);
        } else {
            // Keep primitives as-is
            normalized[key] = value;
        }
    }

    return normalized;
}
