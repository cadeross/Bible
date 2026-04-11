import Foundation

// MARK: - Bible Verse

struct BibleVerse: Identifiable, Codable, Sendable {
    let id: Int          // verse number (1-based)
    let number: String   // display number ("1", "2a", etc.)
    let text: String
    var heading: String? // optional section heading before this verse
    var isRedLetter: Bool = false
}

// MARK: - Bible Chapter

struct BibleChapter: Codable, Sendable {
    let book: String
    let chapter: Int
    let translation: String
    let verses: [BibleVerse]

    var reference: String { "\(book) \(chapter)" }
}

// MARK: - Bible Book

struct BibleBook: Identifiable, Hashable, Sendable {
    let id: String       // canonical name e.g. "Genesis"
    let shortName: String
    let chapterCount: Int
    let testament: Testament

    var displayName: String { id }
}

enum Testament: String, CaseIterable, Sendable {
    case oldTestament = "Old Testament"
    case apocrypha = "Apocrypha"
    case newTestament = "New Testament"
}

// MARK: - Highlight

struct Highlight: Identifiable, Codable, Sendable, Equatable {
    var id: String = UUID().uuidString
    var book: String
    var chapter: Int
    var verse: Int
    var color: HighlightColor
    var note: String?
    var createdAt: Date = .now
}

// MARK: - Translation

struct BibleTranslation: Identifiable, Hashable, Sendable {
    let id: String        // abbreviation e.g. "dra"
    let name: String      // full name
    let language: String
}
