import Foundation

// MARK: - Chapter Navigation (ported from src/lib/chapter-navigation.ts)

struct ChapterNavigation {
    /// Returns the next or previous chapter, crossing book boundaries.
    /// Returns nil at the very start or end of the Bible.
    static func adjacent(to book: String, chapter: Int, delta: Int) -> (book: String, chapter: Int)? {
        let allBooks = BibleData.books
        guard let bookIndex = allBooks.firstIndex(where: { $0.id == book }) else { return nil }
        let currentBook = allBooks[bookIndex]

        let nextChapter = chapter + delta

        if nextChapter >= 1 && nextChapter <= currentBook.chapterCount {
            // Stay in same book
            return (book, nextChapter)
        } else if delta > 0 {
            // Move to next book
            let nextBookIndex = bookIndex + 1
            guard nextBookIndex < allBooks.count else { return nil } // end of Bible
            return (allBooks[nextBookIndex].id, 1)
        } else {
            // Move to previous book
            let prevBookIndex = bookIndex - 1
            guard prevBookIndex >= 0 else { return nil } // start of Bible
            let prevBook = allBooks[prevBookIndex]
            return (prevBook.id, prevBook.chapterCount)
        }
    }

    static func canGoPrev(book: String, chapter: Int) -> Bool {
        adjacent(to: book, chapter: chapter, delta: -1) != nil
    }

    static func canGoNext(book: String, chapter: Int) -> Bool {
        adjacent(to: book, chapter: chapter, delta: 1) != nil
    }

    static func next(book: String, chapter: Int) -> (book: String, chapter: Int)? {
        adjacent(to: book, chapter: chapter, delta: 1)
    }

    static func prev(book: String, chapter: Int) -> (book: String, chapter: Int)? {
        adjacent(to: book, chapter: chapter, delta: -1)
    }
}
