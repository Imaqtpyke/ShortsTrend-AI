import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Normalize a timestamp string for safe comparison across different generate calls.
 * Handles em-dash (–), en-dash (‒), hyphen (-), and whitespace variants so that
 * "00:00 – 00:08" and "00:00 - 00:08" compare as equal.
 */
export function normalizeTs(ts: string): string {
    return ts.replace(/[\u2013\u2014\u2012\-]/g, '-').replace(/\s+/g, '').toLowerCase();
}
