import { BibleChapter, BibleVerse } from "./bible-api";

const BOLLS_API_URL = "https://bolls.life";

// Map standard book names to Bolls Life IDs
const BOLLS_BOOK_IDS: Record<string, number> = {
    "Genesis": 1, "Exodus": 2, "Leviticus": 3, "Numbers": 4, "Deuteronomy": 5,
    "Joshua": 6, "Judges": 7, "Ruth": 8, "1 Samuel": 9, "2 Samuel": 10,
    "1 Kings": 11, "2 Kings": 12, "1 Chronicles": 13, "2 Chronicles": 14,
    "Ezra": 15, "Nehemiah": 16, "Esther": 17, "Job": 18, "Psalms": 19,
    "Proverbs": 20, "Ecclesiastes": 21, "Song of Solomon": 22, "Isaiah": 23,
    "Jeremiah": 24, "Lamentations": 25, "Ezekiel": 26, "Daniel": 27,
    "Hosea": 28, "Joel": 29, "Amos": 30, "Obadiah": 31, "Jonah": 32,
    "Micah": 33, "Nahum": 34, "Habakkuk": 35, "Zephaniah": 36, "Haggai": 37,
    "Zechariah": 38, "Malachi": 39,

    "Matthew": 40, "Mark": 41, "Luke": 42, "John": 43, "Acts": 44,
    "Romans": 45, "1 Corinthians": 46, "2 Corinthians": 47, "Galatians": 48,
    "Ephesians": 49, "Philippians": 50, "Colossians": 51,
    "1 Thessalonians": 52, "2 Thessalonians": 53, "1 Timothy": 54, "2 Timothy": 55,
    "Titus": 56, "Philemon": 57, "Hebrews": 58, "James": 59,
    "1 Peter": 60, "2 Peter": 61, "1 John": 62, "2 John": 63, "3 John": 64,
    "Jude": 65, "Revelation": 66,

    // Deuterocanon (NRSVCE IDs)
    "Tobit": 68,
    "Judith": 69,
    "Wisdom": 70,
    "Sirach": 71,
    "Baruch": 73, // Includes Letter of Jeremiah? Bolls 73 is Baruch.
    "1 Maccabees": 74,
    "2 Maccabees": 75,
    // Note: Bolls might have others, but these are our core Catholic support
};

interface BollsVerse {
    pk: number;
    verse: number;
    text: string;
    comment?: string;
}

export async function getBollsChapter(translation: string, book: string, chapter: number): Promise<BibleChapter> {
    const bookId = BOLLS_BOOK_IDS[book];
    if (!bookId) {
        throw new Error(`Book '${book}' not found in Bolls Life mapping.`);
    }

    try {
        const res = await fetch(`${BOLLS_API_URL}/get-chapter/${translation}/${bookId}/${chapter}/`);
        if (!res.ok) {
            throw new Error(`Failed to fetch from Bolls Life: ${res.statusText}`);
        }

        const data: BollsVerse[] = await res.json();

        // Sometimes Bolls returns empty list for non-existent chapters
        // Sometimes Bolls returns empty list for non-existent chapters (e.g. Deuterocanon in CNBB)
        if (!Array.isArray(data) || data.length === 0) {
            console.warn(`Chapter ${book} ${chapter} not found in ${translation}`);
            return {
                reference: `${book} ${chapter}`,
                verses: [],
                text: "This chapter is not available in the selected translation.",
                translation_id: translation.toLowerCase(),
                translation_name: translation, // Will be updated by caller logic ideally, or keep simple here
                translation_note: "Content not available"
            };
        }

        const verses: BibleVerse[] = data.map(v => ({
            book_id: book.substring(0, 3).toUpperCase(), // Approximate ID for internal use
            book_name: book,
            chapter: chapter,
            verse: v.verse,
            text: v.text
                .replace(/<br\s*\/?>/gi, ' ') // Replace breaks with spaces
                .replace(/<[^>]*>/g, '') // Strip other HTML tags (like <i>)
                .replace(/#[-\u2013\u2014]+\s*#/g, '') // Remove artifact markers like "#— #", "#-- #"
                .replace(/\s+/g, ' ')
                .trim()
        }));

        const cleanText = verses.map(v => v.text).join(' ');

        // Determine nice translation name
        let translationName = translation;
        if (translation === 'NRSVCE') translationName = "New Revised Standard Version Catholic Edition";
        if (translation === 'RSV') translationName = "Revised Standard Version";
        if (translation === 'CNBB') translationName = "Bíblia da CNBB";

        return {
            reference: `${book} ${chapter}`,
            verses,
            text: cleanText,
            translation_id: translation.toLowerCase(),
            translation_name: translationName,
            translation_note: "Provided by Bolls Life API"
        };

    } catch (e) {
        console.error("Bolls Life API Error:", e);
        throw e;
    }
}
