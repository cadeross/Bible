import { BOOK_LIST } from "@/lib/bible-api"
import { parseReadingReference } from "@/lib/reading-reference-parser"

/** Common abbreviations → canonical book name (BOOK_LIST) */
const ABBREV: Record<string, string> = {
    gen: "Genesis",
    exo: "Exodus",
    ex: "Exodus",
    lev: "Leviticus",
    num: "Numbers",
    deu: "Deuteronomy",
    dt: "Deuteronomy",
    jos: "Joshua",
    jdg: "Judges",
    ru: "Ruth",
    "1sa": "1 Samuel",
    "2sa": "2 Samuel",
    "1ki": "1 Kings",
    "2ki": "2 Kings",
    "1ch": "1 Chronicles",
    "2ch": "2 Chronicles",
    ezr: "Ezra",
    neh: "Nehemiah",
    job: "Job",
    ps: "Psalms",
    psa: "Psalms",
    pro: "Proverbs",
    ecc: "Ecclesiastes",
    so: "Song of Solomon",
    song: "Song of Solomon",
    isa: "Isaiah",
    jer: "Jeremiah",
    lam: "Lamentations",
    ezk: "Ezekiel",
    eze: "Ezekiel",
    dan: "Daniel",
    hos: "Hosea",
    jol: "Joel",
    amo: "Amos",
    oba: "Obadiah",
    jon: "Jonah",
    mic: "Micah",
    nam: "Nahum",
    hab: "Habakkuk",
    zep: "Zephaniah",
    hag: "Haggai",
    zec: "Zechariah",
    mal: "Malachi",
    mat: "Matthew",
    mt: "Matthew",
    mrk: "Mark",
    mk: "Mark",
    luk: "Luke",
    lk: "Luke",
    jhn: "John",
    jn: "John",
    act: "Acts",
    rom: "Romans",
    "1co": "1 Corinthians",
    "2co": "2 Corinthians",
    gal: "Galatians",
    eph: "Ephesians",
    php: "Philippians",
    col: "Colossians",
    "1th": "1 Thessalonians",
    "2th": "2 Thessalonians",
    "1ti": "1 Timothy",
    "2ti": "2 Timothy",
    tit: "Titus",
    phm: "Philemon",
    heb: "Hebrews",
    jas: "James",
    "1pe": "1 Peter",
    "2pe": "2 Peter",
    "1jn": "1 John",
    "2jn": "2 John",
    "3jn": "3 John",
    jud: "Jude",
    rev: "Revelation",
}

function normalizeBookToken(raw: string): string {
    const t = raw.trim().toLowerCase().replace(/\./g, "")
    if (ABBREV[t]) return ABBREV[t]
    return raw.trim()
}

/**
 * Resolve "Book Name" prefix against BOOK_LIST (longest match).
 */
function matchBookName(bookPart: string): string | null {
    const normalized = normalizeBookToken(bookPart)
    const lower = normalized.toLowerCase()

    let best: string | null = null
    for (const name of BOOK_LIST) {
        const nl = name.toLowerCase()
        if (nl === lower) return name
        if (nl.startsWith(lower) || lower.startsWith(nl)) {
            if (!best || name.length > best.length) best = name
        }
    }
    // Prefer startsWith over fuzzy contains
    const starts = BOOK_LIST.filter((b) => b.toLowerCase().startsWith(lower))
    if (starts.length === 1) return starts[0]
    if (starts.length > 1) {
        return starts.sort((a, b) => a.length - b.length)[0]
    }
    return best
}

export interface JumpTarget {
    book: string
    chapter: number
    verse?: number
}

/**
 * Parse user jump strings: "John 3", "Jn 3:16", "Genesis 1", "1 Cor 13:1"
 */
export function parseReferenceJump(input: string): JumpTarget | null {
    const trimmed = input.trim()
    if (!trimmed) return null

    const ref = parseReadingReference(trimmed)
    if (ref) {
        return {
            book: ref.book,
            chapter: ref.chapter,
            verse: ref.verses[0],
        }
    }

    // "1 Corinthians 2:3" style (parser expects space before chapter)
    const loose = trimmed.match(/^(.+?)\s+(\d+)\s*:\s*(\d+)\s*$/i)
    if (loose) {
        const book = matchBookName(loose[1])
        const chapter = parseInt(loose[2], 10)
        const verse = parseInt(loose[3], 10)
        if (book && !isNaN(chapter) && !isNaN(verse)) {
            return { book, chapter, verse }
        }
    }

    const chapterOnly = trimmed.match(/^(.+?)\s+(\d+)\s*$/i)
    if (chapterOnly) {
        const book = matchBookName(chapterOnly[1])
        const chapter = parseInt(chapterOnly[2], 10)
        if (book && !isNaN(chapter) && chapter >= 1) {
            return { book, chapter }
        }
    }

    return null
}
