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
    { id: 'dra', name: 'Douay-Rheims 1899 American Edition' },
    { id: 'web', name: 'World English Bible' },
    { id: 'kjv', name: 'King James Version' },
    { id: 'asv', name: 'American Standard Version' },
    { id: 'bbe', name: 'Bible in Basic English' },
];

const BASE_URL = 'https://bible-api.com';

export async function getChapter(book: string, chapter: number, translation: string = 'web'): Promise<BibleChapter> {
    // Simple fetch wrapper. 
    // In a real app we'd cache this heavily or use ISR.
    // Example: bible-api.com/john+3:1-16?translation=kjv

    // Clean book name
    const cleanBook = book.toLowerCase().replace(/\s/g, '');

    const res = await fetch(`${BASE_URL}/${cleanBook}+${chapter}?translation=${translation}`);

    if (!res.ok) {
        throw new Error('Failed to fetch chapter');
    }

    return res.json();
}

export const BOOK_LIST = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];
