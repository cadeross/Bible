export interface BibleVerse {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface BibleChapter {
    reference: string;
    verses: BibleVerse[];
    text: string;
    translation_id: string;
    translation_name: string;
    translation_note: string;
}

// getChapter already accepts translation. 
// Just ensuring types and exports are correct.

export const TRANSLATIONS = [
    { id: 'web', name: 'World English Bible' },
    { id: 'kjv', name: 'King James Version' },
    { id: 'asv', name: 'American Standard Version (1901)' },
    { id: 'bbe', name: 'Bible in Basic English' },
    { id: 'darby', name: 'Darby Bible' },
    { id: 'dra', name: 'Douay-Rheims 1899 American Edition' },
    { id: 'ylt', name: 'Young\'s Literal Translation' },
    { id: 'oeb-cw', name: 'Open English Bible (Commonwealth)' },
    { id: 'webbe', name: 'World English Bible (British)' },
    { id: 'oeb-us', name: 'Open English Bible (US)' },
    { id: 'clementine', name: 'Clementine Latin Vulgate' },
    { id: 'almeida', name: 'João Ferreira de Almeida' },
    { id: 'rccv', name: 'Romanian Corrected Cornilescu' },
    { id: 'synodal', name: 'Russian Synodal Translation' },
    { id: 'cherokee', name: 'Cherokee New Testament' },
    { id: 'cuv', name: 'Chinese Union Version' },
    { id: 'bkr', name: 'Bible kralická' },
];

export async function getAllTranslations() {
    try {
        const apiBibles = await getAvailableBibles();
        const apiTranslations = apiBibles.map(b => ({
            id: b.id,
            name: b.name,
            abbreviation: b.abbreviation
        }));

        const legacyTranslations = TRANSLATIONS.map(t => ({
            ...t,
            abbreviation: t.id
        }));

        return [...legacyTranslations, ...apiTranslations];
    } catch (e) {
        console.error("Failed to load API translations", e);
        return TRANSLATIONS;
    }
}

const BASE_URL = 'https://bible-api.com';

import { getChapterText as getApiBibleChapter, getAvailableBibles } from './api-bible';

export async function getChapter(book: string, chapter: number, translation: string = 'web'): Promise<BibleChapter> {
    // Check if it's a legacy translation or an API.bible translation
    // API.bible IDs are usually longer UUIDs (e.g. "de4e12af7f28f599-01")
    // Legacy IDs are short (e.g. "kjv", "web")
    const isLegacy = TRANSLATIONS.some(t => t.id === translation);

    if (isLegacy) {
        // Clean book name
        const cleanBook = book.toLowerCase().replace(/\s/g, '');
        const res = await fetch(`${BASE_URL}/${cleanBook}+${chapter}?translation=${translation}`);
        if (!res.ok) throw new Error('Failed to fetch chapter');
        return res.json();
    } else {
        // Use API.bible
        // We need the Bible ID. The 'translation' arg here IS the bibleId.
        // And we need the Book ID (e.g. "GEN")
        const bookId = getBookId(book);
        const chapterId = `${bookId}.${chapter}`;

        const data = await getApiBibleChapter(translation, chapterId);
        if (!data) throw new Error('Failed to fetch chapter from API.bible');

        // Parse HTML content to verses
        // Content usually looks like: <span data-v="GEN.1.1" class="v">1</span> In the beginning...
        // We need to extract text for each verse.
        // This is a simplified regex parser. Robust parsing requires a DOM parser (cheerio or browser DOM).
        // Since we are likely on client, we can use DOMParser if window exists, or regex fallback.

        const verses: BibleVerse[] = [];
        let cleanText = "";

        if (typeof window !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.content, 'text/html');

            // Extract verses
            // Strategy: Find all verse spans/elements, get text between them.
            // API.bible structure varies. Common: <span data-v="GEN.1.1">...</span>
            // Or just spans with class 'v'. 
            // Better: Request 'text' content type? No, sticking to HTML as planned.

            // Actually, for immediate robustness without complex parsing, let's treat the whole chapter as one verse 
            // OR try to split by verse numbers.
            // Let's try to extract basic text.
            cleanText = doc.body.textContent || "";

            // Mocking verses logic for now:
            // Converting the whole text into a single "verse" 1 if parsing fails, 
            // or splitting by regex if possible.
            // A simple regex approach for API.bible text (if we used text format): [1] ... [2] ...

            // Let's rely on a simple breakdown.
            // We'll create a single "verse" block for the chapter text to preserve readability if parsing is hard.
            // BUT highlighting works on verse level.
            // Let's try to find verse markers.

            const verseSpans = doc.querySelectorAll('span[data-v]');
            if (verseSpans.length > 0) {
                verseSpans.forEach((span) => {
                    const vRef = span.getAttribute('data-v'); // GEN.1.1
                    if (vRef) {
                        const parts = vRef.split('.');
                        const vNum = parseInt(parts[2]);
                        // The text IS inside the span usually? Or after?
                        // API.bible: <span ...>1</span> TEXT...
                        // The text is a sibling node usually.

                        let text = "";
                        let next = span.nextSibling;
                        while (next && next.nodeName !== 'SPAN') { // very naive
                            text += next.textContent;
                            next = next.nextSibling;
                        }

                        verses.push({
                            book_id: bookId,
                            book_name: book,
                            chapter: chapter,
                            verse: vNum,
                            text: text.trim()
                        });
                    }
                });
            }
        }

        // Fallback if no verses found (e.g. server side or parsing failed)
        if (verses.length === 0) {
            // Remove HTML tags
            const text = data.content.replace(/<[^>]*>/g, '');
            verses.push({
                book_id: bookId,
                book_name: book,
                chapter: chapter,
                verse: 1,
                text: text
            });
        }

        return {
            reference: data.reference,
            verses: verses,
            text: cleanText,
            translation_id: translation,
            translation_name: "API Version", // We could fetch this info or pass it
            translation_note: data.copyright
        };
    }
}

// Helper to map Book Name to USFM/API.bible ID (e.g. "Genesis" -> "GEN")
function getBookId(bookName: string): string {
    // This mapping needs to be comprehensive.
    // For now, simple 3 letter upper case helper usually works for standard books?
    // Genesis -> GEN, Exodus -> EXO? No, standard is GEN, EXO, LEV, NUM, DEU...
    // Let's use a mapping object.
    const map: Record<string, string> = {
        "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
        "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
        "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
        "Ezra": "EZR", "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB", "Psalms": "PSA",
        "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA",
        "Jeremiah": "JER", "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN",
        "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
        "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG",
        "Zechariah": "ZEC", "Malachi": "MAL",
        "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
        "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Galatians": "GAL",
        "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL",
        "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI",
        "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS",
        "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", "3 John": "3JN",
        "Jude": "JUD", "Revelation": "REV"
    };
    return map[bookName] || bookName.substring(0, 3).toUpperCase();
}

export const BOOK_LIST = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];
