import Foundation

// MARK: - Static Bible Data (ported from src/lib/bible-data.ts)

struct BibleData {
    static let books: [BibleBook] = oldTestament + apocrypha + newTestament

    // MARK: Old Testament (46 books)
    static let oldTestament: [BibleBook] = [
        .init(id: "Genesis",        shortName: "Gen",   chapterCount: 50, testament: .oldTestament),
        .init(id: "Exodus",         shortName: "Exod",  chapterCount: 40, testament: .oldTestament),
        .init(id: "Leviticus",      shortName: "Lev",   chapterCount: 27, testament: .oldTestament),
        .init(id: "Numbers",        shortName: "Num",   chapterCount: 36, testament: .oldTestament),
        .init(id: "Deuteronomy",    shortName: "Deut",  chapterCount: 34, testament: .oldTestament),
        .init(id: "Joshua",         shortName: "Josh",  chapterCount: 24, testament: .oldTestament),
        .init(id: "Judges",         shortName: "Judg",  chapterCount: 21, testament: .oldTestament),
        .init(id: "Ruth",           shortName: "Ruth",  chapterCount: 4,  testament: .oldTestament),
        .init(id: "1 Samuel",       shortName: "1 Sam", chapterCount: 31, testament: .oldTestament),
        .init(id: "2 Samuel",       shortName: "2 Sam", chapterCount: 24, testament: .oldTestament),
        .init(id: "1 Kings",        shortName: "1 Kgs", chapterCount: 22, testament: .oldTestament),
        .init(id: "2 Kings",        shortName: "2 Kgs", chapterCount: 25, testament: .oldTestament),
        .init(id: "1 Chronicles",   shortName: "1 Chr", chapterCount: 29, testament: .oldTestament),
        .init(id: "2 Chronicles",   shortName: "2 Chr", chapterCount: 36, testament: .oldTestament),
        .init(id: "Ezra",           shortName: "Ezra",  chapterCount: 10, testament: .oldTestament),
        .init(id: "Nehemiah",       shortName: "Neh",   chapterCount: 13, testament: .oldTestament),
        .init(id: "Tobit",          shortName: "Tob",   chapterCount: 14, testament: .apocrypha),
        .init(id: "Judith",         shortName: "Jdt",   chapterCount: 16, testament: .apocrypha),
        .init(id: "Esther",         shortName: "Esth",  chapterCount: 10, testament: .oldTestament),
        .init(id: "1 Maccabees",    shortName: "1 Mac", chapterCount: 16, testament: .apocrypha),
        .init(id: "2 Maccabees",    shortName: "2 Mac", chapterCount: 15, testament: .apocrypha),
        .init(id: "Job",            shortName: "Job",   chapterCount: 42, testament: .oldTestament),
        .init(id: "Psalms",         shortName: "Ps",    chapterCount: 150, testament: .oldTestament),
        .init(id: "Proverbs",       shortName: "Prov",  chapterCount: 31, testament: .oldTestament),
        .init(id: "Ecclesiastes",   shortName: "Eccl",  chapterCount: 12, testament: .oldTestament),
        .init(id: "Song of Solomon", shortName: "Song", chapterCount: 8,  testament: .oldTestament),
        .init(id: "Wisdom",         shortName: "Wis",   chapterCount: 19, testament: .apocrypha),
        .init(id: "Sirach",         shortName: "Sir",   chapterCount: 51, testament: .apocrypha),
        .init(id: "Isaiah",         shortName: "Isa",   chapterCount: 66, testament: .oldTestament),
        .init(id: "Jeremiah",       shortName: "Jer",   chapterCount: 52, testament: .oldTestament),
        .init(id: "Lamentations",   shortName: "Lam",   chapterCount: 5,  testament: .oldTestament),
        .init(id: "Baruch",         shortName: "Bar",   chapterCount: 6,  testament: .apocrypha),
        .init(id: "Ezekiel",        shortName: "Ezek",  chapterCount: 48, testament: .oldTestament),
        .init(id: "Daniel",         shortName: "Dan",   chapterCount: 14, testament: .oldTestament),
        .init(id: "Hosea",          shortName: "Hos",   chapterCount: 14, testament: .oldTestament),
        .init(id: "Joel",           shortName: "Joel",  chapterCount: 3,  testament: .oldTestament),
        .init(id: "Amos",           shortName: "Amos",  chapterCount: 9,  testament: .oldTestament),
        .init(id: "Obadiah",        shortName: "Obad",  chapterCount: 1,  testament: .oldTestament),
        .init(id: "Jonah",          shortName: "Jon",   chapterCount: 4,  testament: .oldTestament),
        .init(id: "Micah",          shortName: "Mic",   chapterCount: 7,  testament: .oldTestament),
        .init(id: "Nahum",          shortName: "Nah",   chapterCount: 3,  testament: .oldTestament),
        .init(id: "Habakkuk",       shortName: "Hab",   chapterCount: 3,  testament: .oldTestament),
        .init(id: "Zephaniah",      shortName: "Zeph",  chapterCount: 3,  testament: .oldTestament),
        .init(id: "Haggai",         shortName: "Hag",   chapterCount: 2,  testament: .oldTestament),
        .init(id: "Zechariah",      shortName: "Zech",  chapterCount: 14, testament: .oldTestament),
        .init(id: "Malachi",        shortName: "Mal",   chapterCount: 4,  testament: .oldTestament),
    ]

    // Apocrypha entries mixed into OT above; expose separately for section headers
    static let apocrypha: [BibleBook] = []

    // MARK: New Testament (27 books)
    static let newTestament: [BibleBook] = [
        .init(id: "Matthew",        shortName: "Matt",  chapterCount: 28, testament: .newTestament),
        .init(id: "Mark",           shortName: "Mark",  chapterCount: 16, testament: .newTestament),
        .init(id: "Luke",           shortName: "Luke",  chapterCount: 24, testament: .newTestament),
        .init(id: "John",           shortName: "John",  chapterCount: 21, testament: .newTestament),
        .init(id: "Acts",           shortName: "Acts",  chapterCount: 28, testament: .newTestament),
        .init(id: "Romans",         shortName: "Rom",   chapterCount: 16, testament: .newTestament),
        .init(id: "1 Corinthians",  shortName: "1 Cor", chapterCount: 16, testament: .newTestament),
        .init(id: "2 Corinthians",  shortName: "2 Cor", chapterCount: 13, testament: .newTestament),
        .init(id: "Galatians",      shortName: "Gal",   chapterCount: 6,  testament: .newTestament),
        .init(id: "Ephesians",      shortName: "Eph",   chapterCount: 6,  testament: .newTestament),
        .init(id: "Philippians",    shortName: "Phil",  chapterCount: 4,  testament: .newTestament),
        .init(id: "Colossians",     shortName: "Col",   chapterCount: 4,  testament: .newTestament),
        .init(id: "1 Thessalonians",shortName: "1 Thes",chapterCount: 5,  testament: .newTestament),
        .init(id: "2 Thessalonians",shortName: "2 Thes",chapterCount: 3,  testament: .newTestament),
        .init(id: "1 Timothy",      shortName: "1 Tim", chapterCount: 6,  testament: .newTestament),
        .init(id: "2 Timothy",      shortName: "2 Tim", chapterCount: 4,  testament: .newTestament),
        .init(id: "Titus",          shortName: "Titus", chapterCount: 3,  testament: .newTestament),
        .init(id: "Philemon",       shortName: "Phlm",  chapterCount: 1,  testament: .newTestament),
        .init(id: "Hebrews",        shortName: "Heb",   chapterCount: 13, testament: .newTestament),
        .init(id: "James",          shortName: "Jas",   chapterCount: 5,  testament: .newTestament),
        .init(id: "1 Peter",        shortName: "1 Pet", chapterCount: 5,  testament: .newTestament),
        .init(id: "2 Peter",        shortName: "2 Pet", chapterCount: 3,  testament: .newTestament),
        .init(id: "1 John",         shortName: "1 John",chapterCount: 5,  testament: .newTestament),
        .init(id: "2 John",         shortName: "2 John",chapterCount: 1,  testament: .newTestament),
        .init(id: "3 John",         shortName: "3 John",chapterCount: 1,  testament: .newTestament),
        .init(id: "Jude",           shortName: "Jude",  chapterCount: 1,  testament: .newTestament),
        .init(id: "Revelation",     shortName: "Rev",   chapterCount: 22, testament: .newTestament),
    ]

    // MARK: Helpers

    static func book(named name: String) -> BibleBook? {
        books.first { $0.id.lowercased() == name.lowercased() }
    }

    static func chapterCount(for bookName: String) -> Int {
        book(named: bookName)?.chapterCount ?? 1
    }

    /// All books grouped by testament for list section headers
    static var groupedByTestament: [(Testament, [BibleBook])] {
        let grouped = Dictionary(grouping: books) { $0.testament }
        return Testament.allCases.compactMap { testament in
            guard let bks = grouped[testament], !bks.isEmpty else { return nil }
            return (testament, bks)
        }
    }
}
