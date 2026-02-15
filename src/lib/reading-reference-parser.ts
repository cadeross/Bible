/**
 * Parses USCCB-style Bible references into structured data.
 * 
 * Examples:
 *   "Sirach 15:15-20"           → { book: "Sirach", chapter: 15, verses: [15,16,17,18,19,20] }
 *   "Psalm 119:1-2, 4-5, 17-18" → { book: "Psalms", chapter: 119, verses: [1,2,4,5,17,18] }
 *   "1 Corinthians 2:6-10"     → { book: "1 Corinthians", chapter: 2, verses: [6,7,8,9,10] }
 *   "Matthew 5:17-37"          → { book: "Matthew", chapter: 5, verses: [17..37] }
 */

export interface ParsedReference {
    book: string;
    chapter: number;
    verses: number[];  // specific verse numbers to include
}

/**
 * Normalize book names for the Bible API.
 * E.g., "Psalm" → "Psalms" (API expects plural)
 */
function normalizeBookName(book: string): string {
    const normalizations: Record<string, string> = {
        'Psalm': 'Psalms',
        'Song of Songs': 'Song of Solomon',
    };
    return normalizations[book] || book;
}

/**
 * Parse a single verse range string like "15-20" or "4b-9" into an array of verse numbers.
 * Strips letter suffixes (a, b, c) from verse numbers.
 */
function parseVerseRange(rangeStr: string): number[] {
    const trimmed = rangeStr.trim();

    // Handle single verse: "15" or "4b"
    if (!trimmed.includes('-')) {
        const num = parseInt(trimmed.replace(/[a-z]/gi, ''), 10);
        return isNaN(num) ? [] : [num];
    }

    // Handle range: "15-20" or "4b-9"
    const parts = trimmed.split('-');
    const start = parseInt(parts[0].replace(/[a-z]/gi, ''), 10);
    const end = parseInt(parts[1].replace(/[a-z]/gi, ''), 10);

    if (isNaN(start) || isNaN(end)) return [];

    const verses: number[] = [];
    for (let i = start; i <= end; i++) {
        verses.push(i);
    }
    return verses;
}

/**
 * Parse a USCCB-style reference string into structured data.
 * Returns null if the reference can't be parsed.
 */
export function parseReadingReference(reference: string): ParsedReference | null {
    if (!reference || reference.trim().length === 0) return null;

    // Match pattern: "Book Name Chapter:Verses"
    // Book name can include numbers (e.g., "1 Corinthians") and multiple words
    // The chapter:verse part is at the end
    const match = reference.match(/^(.+?)\s+(\d+):(.+)$/);

    if (!match) return null;

    const [, rawBook, chapterStr, versesStr] = match;
    const book = normalizeBookName(rawBook.trim());
    const chapter = parseInt(chapterStr, 10);

    if (isNaN(chapter)) return null;

    // Parse verse ranges: "1-2, 4-5, 17-18" → split by comma, parse each range
    const ranges = versesStr.split(',');
    const verses: number[] = [];

    for (const range of ranges) {
        verses.push(...parseVerseRange(range));
    }

    if (verses.length === 0) return null;

    return { book, chapter, verses };
}
