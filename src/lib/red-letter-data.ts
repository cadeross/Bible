export type RedLetterMap = {
    [book: string]: {
        [chapter: number]: number[] // Array of verse numbers containing red letters
    }
}

// Data for demonstration: Sermon on the Mount + John 3
// In a real app, this would be a large JSON file imported dynamically
export const RED_LETTER_DATA: RedLetterMap = {
    "Matthew": {
        // Sermon on the Mount (partial)
        5: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
        6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
        7: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]
    },
    "John": {
        3: [3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
    }
}

export function isRedLetterVerse(book: string, chapter: number, verse: number): boolean {
    const bookData = RED_LETTER_DATA[book]
    if (!bookData) return false

    const chapterData = bookData[chapter]
    if (!chapterData) return false

    return chapterData.includes(verse)
}
