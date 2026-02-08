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

        // Deduplicate: Filter out API translations that match legacy IDs
        // Deduplicate: Filter out API translations that match legacy IDs or Abbreviations
        const legacyIds = new Set(legacyTranslations.map(t => t.id.toLowerCase()));
        const legacyAbbrevs = new Set(legacyTranslations.map(t => (t.abbreviation || t.id).toLowerCase()));

        const uniqueApiTranslations = apiTranslations.filter(t => {
            const id = t.id.toLowerCase();
            const abbrev = (t.abbreviation || "").toLowerCase();
            const name = t.name.toLowerCase();

            // Hard exclusions for "The Message"
            if (abbrev === 'msg' || name.includes("the message")) return false;

            // Aggressive deduplication for World English Bible
            // API.bible has many variants (UK, Catholic, etc) that clutter the list
            // We force use of our specific defined WEB versions in the legacy list
            if (name.includes("world english bible")) return false;

            // Same for KJV - if the name is just "King James Version" (or close), skip it
            // We have our own KJV entry.
            if (name === "king james version" || name === "king james version (1769)" || id === 'kjv') return false;

            // General Checks against legacy list
            const isLegacyId = legacyIds.has(id);
            const isLegacyAbbrev = abbrev && legacyAbbrevs.has(abbrev);
            const isLegacyName = legacyTranslations.some(lt => lt.name.toLowerCase() === name);

            return !isLegacyId && !isLegacyAbbrev && !isLegacyName;
        });

        return [...legacyTranslations, ...uniqueApiTranslations];
    } catch (e) {
        console.error("Failed to load API translations", e);
        return TRANSLATIONS;
    }
}

const BASE_URL = 'https://bible-api.com';

import { getChapterText as getApiBibleChapter, getAvailableBibles } from './api-bible';

export async function getChapter(book: string, chapter: number, translation: string = 'web'): Promise<BibleChapter> {
    const isLegacy = TRANSLATIONS.some(t => t.id === translation);

    if (isLegacy) {
        // Fallback for missing Catholic books in API AND handle full DRA locally due to API 403 blocks
        if (translation === 'dra') {
            return getLocalChapter(book, chapter);
        }

        const cleanBook = book.toLowerCase().replace(/\s/g, '');
        const res = await fetch(`${BASE_URL}/${cleanBook}+${chapter}?translation=${translation}`);
        if (!res.ok) throw new Error('Failed to fetch chapter');
        const data = await res.json();
        return {
            ...data,
            translation_note: data.translation_note || "Public Domain"
        };
    } else {
        const bookId = getBookId(book);
        const chapterId = `${bookId}.${chapter}`;

        let data;
        try {
            data = await getApiBibleChapter(translation, chapterId);
            if (!data) throw new Error('Failed to fetch chapter from API.bible');
        } catch (e) {
            console.warn(`Failed to fetch ${translation}, falling back to WEB`, e);
            // Fallback to WEB if the specific translation fails (e.g. 403 Forbidden)
            const fallbackId = 'web'; // World English Bible
            try {
                // Determine if fallback is legacy or API
                // WEB is in our legacy list but also available via API.
                // Our system treats 'web' as legacy ID.
                // But wait, getChapter is recursive-ish if we just call getChapter('web')?
                // No, 'web' hits the `isLegacy` block at the top of this function.
                return getChapter(book, chapter, 'web');
            } catch (fallbackError) {
                throw new Error(`Failed to fetch chapter from fallback (WEB): ${fallbackError}`);
            }
        }

        const verses: BibleVerse[] = [];
        let cleanText = "";

        // Universal Regex Parser (Works on Server & Client)
        // Matches verse spans like <span data-number="1" ...>1</span>
        // We capture the whole tag to find its position.
        const verseTagRegex = /<span[^>]*data-number="(\d+)"[^>]*>.*?<\/span>/gi;

        let match;
        let lastIndex = 0;
        let lastVerse: BibleVerse | null = null;

        // Helper to strip HTML tags from text
        const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        while ((match = verseTagRegex.exec(data.content)) !== null) {
            // Found a verse start
            const [fullTag, numStr] = match;
            const currentIndex = match.index;

            // If we have a previous verse, its text ends here
            if (lastVerse) {
                const rawText = data.content.substring(lastIndex, currentIndex);
                lastVerse.text = stripHtml(rawText);
                verses.push(lastVerse);
            }

            // Start new verse
            lastVerse = {
                book_id: bookId,
                book_name: book,
                chapter: chapter,
                verse: parseInt(numStr), // Use the number inside the tag
                text: "" // Will be filled in next iteration or end of loop
            };

            // Update lastIndex to be AFTER this tag
            lastIndex = currentIndex + fullTag.length;
        }

        // Handle the last verse (text from last tag to end of content)
        if (lastVerse) {
            const rawText = data.content.substring(lastIndex);
            lastVerse.text = stripHtml(rawText);
            verses.push(lastVerse);
        }

        // Fallback: If regex failed (no standard verse tags found), try to just strip HTML and return one verse
        if (verses.length === 0) {
            const text = stripHtml(data.content);
            cleanText = text; // For the chapter text field
            verses.push({
                book_id: bookId,
                book_name: book,
                chapter: chapter,
                verse: 1,
                text: text
            });
        } else {
            cleanText = verses.map(v => v.text).join(' ');
        }

        let translationName = "API Version";
        try {
            // Find the translation name from the available bibles list
            // Optimization: In a real app we might cache this list or pass it in.
            // But since getAvailableBibles is largely static or cached by Next.js if configured, it might be okay.
            // Better: use the 'bibles' endpoint for single ID if available, but getAvailableBibles is what we have helper for.
            const allBibles = await getAvailableBibles();
            const bible = allBibles.find(b => b.id === translation);
            if (bible) translationName = bible.name;
        } catch (e) {
            console.warn("Could not fetch translation details for name", e);
        }

        return {
            reference: data.reference,
            verses: verses,
            text: cleanText,
            translation_id: translation,
            translation_name: translationName,
            translation_note: data.copyright
        };
    }
}

/**
 * Fetch a single verse text from a specific Bible version
 * @param book - Book name (e.g., "Genesis")
 * @param chapter - Chapter number
 * @param verse - Verse number
 * @param translation - Bible version ID (e.g., "web", "40adb70626acff3f-01")
 * @returns The verse text string
 */
export async function getVerseText(
    book: string,
    chapter: number,
    verse: number,
    translation: string = 'web'
): Promise<string> {
    try {
        // Fetch the full chapter
        const chapterData = await getChapter(book, chapter, translation);

        // Find the specific verse
        const verseData = chapterData.verses.find(v => v.verse === verse);

        if (!verseData) {
            throw new Error(`Verse ${verse} not found in ${book} ${chapter} (translation: ${translation})`);
        }

        return verseData.text;
    } catch (error) {
        // Re-throw with more context
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch ${book} ${chapter}:${verse} in ${translation}: ${errorMessage}`);
    }
}



// Helper to map Book Name to USFM/API.bible ID (e.g. "Genesis" -> "GEN")
function getBookId(bookName: string): string {
    const map: Record<string, string> = {
        "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
        "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
        "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
        "Ezra": "EZR", "Nehemiah": "NEH", "Tobit": "TOB", "Judith": "JDT", "Esther": "EST", "Job": "JOB", "Psalms": "PSA",
        "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Wisdom": "WIS", "Sirach": "SIR", "Isaiah": "ISA",
        "Jeremiah": "JER", "Lamentations": "LAM", "Baruch": "BAR", "Ezekiel": "EZK", "Daniel": "DAN",
        "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
        "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG",
        "Zechariah": "ZEC", "Malachi": "MAL", "1 Maccabees": "1MA", "2 Maccabees": "2MA",
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

async function getLocalChapter(book: string, chapter: number): Promise<BibleChapter> {
    // Map standard names to our local filenames (which are based on standard names mostly)
    // Filenames are basically standard names with spaces removed.
    // Exceptions: Sirach -> Encoded as Ecclesiasticus in our files
    let filenameBase = book.replace(/\s/g, '');
    if (book === "Sirach") filenameBase = "Ecclesiasticus";

    try {
        // Dynamic import for client-side bundle text
        // Ensure data files are in src/lib/data/DRA_<Book>.json
        const data = await import(`@/lib/data/DRA_${filenameBase}.json`);

        // DRA JSON keys are usually just the number "1", "2" etc.
        const chapterData = data.default[chapter.toString()];

        if (!chapterData) throw new Error("Chapter not found locally");

        // Convert key-value verses to array
        const verses: BibleVerse[] = Object.entries(chapterData).map(([verseNum, text]) => ({
            book_id: book.substring(0, 3).toUpperCase(),
            book_name: book,
            chapter: chapter,
            verse: parseInt(verseNum),
            text: (text as string).replace(/\*/g, '').trim() // Clean asterisks often found in DRA text
        })).sort((a, b) => a.verse - b.verse);

        return {
            reference: `${book} ${chapter}`,
            verses,
            text: verses.map(v => v.text).join(' '),
            translation_id: 'dra',
            translation_name: 'Douay-Rheims 1899 American Edition',
            translation_note: 'Public Domain (Local)'
        };
    } catch (e) {
        console.error(`Failed to load local chapter for ${book} ${chapter}`, e);
        throw new Error("Chapter not found locally");
    }
}

export const BOOK_LIST = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Tobit", "Judith", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Wisdom", "Sirach", "Isaiah", "Jeremiah", "Lamentations", "Baruch", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "1 Maccabees", "2 Maccabees",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];
