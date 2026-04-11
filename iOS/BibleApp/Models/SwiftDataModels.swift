import SwiftData
import Foundation

// MARK: - Persistent Highlight (SwiftData)

@Model
final class HighlightRecord {
    var id: String
    var book: String
    var chapter: Int
    var verse: Int
    var color: String      // HighlightColor.rawValue
    var note: String?
    var createdAt: Date
    var syncedToCloud: Bool

    init(from highlight: Highlight) {
        self.id = highlight.id
        self.book = highlight.book
        self.chapter = highlight.chapter
        self.verse = highlight.verse
        self.color = highlight.color.rawValue
        self.note = highlight.note
        self.createdAt = highlight.createdAt
        self.syncedToCloud = false
    }

    func toHighlight() -> Highlight {
        Highlight(
            id: id,
            book: book,
            chapter: chapter,
            verse: verse,
            color: HighlightColor(rawValue: color) ?? .yellow,
            note: note,
            createdAt: createdAt
        )
    }
}

// MARK: - Persistent Reading History (SwiftData)

@Model
final class ReadingHistoryRecord {
    var id: String
    var book: String
    var chapter: Int
    var wordsRead: Int
    var durationSeconds: Int
    var completedAt: Date

    init(book: String, chapter: Int, wordsRead: Int, durationSeconds: Int) {
        self.id = UUID().uuidString
        self.book = book
        self.chapter = chapter
        self.wordsRead = wordsRead
        self.durationSeconds = durationSeconds
        self.completedAt = .now
    }
}
