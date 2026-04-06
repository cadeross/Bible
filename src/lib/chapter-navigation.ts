import { BIBLE_BOOKS } from "@/lib/bible-data"
import { BOOK_LIST } from "@/lib/bible-api"

export function getChapterCountForBook(book: string): number {
    const b = BIBLE_BOOKS.find((x) => x.name === book)
    return b?.chapters ?? 1
}

/** Next or previous chapter; crosses book boundaries. Returns null at Bible start/end. */
export function getAdjacentChapter(
    book: string,
    chapter: number,
    delta: 1 | -1
): { book: string; chapter: number } | null {
    const idx = BOOK_LIST.indexOf(book)
    if (idx === -1) return null

    if (delta === -1) {
        if (chapter > 1) return { book, chapter: chapter - 1 }
        if (idx === 0) return null
        const prevBook = BOOK_LIST[idx - 1]
        const prevMax = getChapterCountForBook(prevBook)
        return { book: prevBook, chapter: prevMax }
    }

    const max = getChapterCountForBook(book)
    if (chapter < max) return { book, chapter: chapter + 1 }
    if (idx >= BOOK_LIST.length - 1) return null
    const nextBook = BOOK_LIST[idx + 1]
    return { book: nextBook, chapter: 1 }
}

export function canGoPrevChapter(book: string, chapter: number): boolean {
    return getAdjacentChapter(book, chapter, -1) !== null
}

export function canGoNextChapter(book: string, chapter: number): boolean {
    return getAdjacentChapter(book, chapter, 1) !== null
}
