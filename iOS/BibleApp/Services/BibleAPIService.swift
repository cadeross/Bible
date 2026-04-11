import Foundation

// MARK: - Supported Translations

extension BibleTranslation {
    static let all: [BibleTranslation] = [
        .init(id: "dra",     name: "Douay-Rheims 1899",             language: "English"),
        .init(id: "nrsvce",  name: "New Revised Standard Catholic", language: "English"),
        .init(id: "kjv",     name: "King James Version",            language: "English"),
        .init(id: "web",     name: "World English Bible",           language: "English"),
        .init(id: "asv",     name: "American Standard Version",     language: "English"),
        .init(id: "bbe",     name: "Bible in Basic English",        language: "English"),
        .init(id: "darby",   name: "Darby Bible",                   language: "English"),
        .init(id: "cnbb",    name: "Bíblia da CNBB",                language: "Portuguese"),
    ]

    static func translation(id: String) -> BibleTranslation? {
        all.first { $0.id.lowercased() == id.lowercased() }
    }
}

// MARK: - Bible API Service

actor BibleAPIService {
    static let shared = BibleAPIService()

    // In-memory cache: "Book-chapter-translation" → BibleChapter
    private var cache: [String: BibleChapter] = [:]

    // API.bible translation ID mapping
    private let apiBibleIds: [String: String] = [
        "kjv":    "de4e12af7f28f599-02",
        "asv":    "685d1470fe4d5c3b-01",
        "web":    "9879dbb7cfe39e4d-01",
        "darby":  "a72018633b3f5521-01",
        "dra":    "179568874c45066f-01",
    ]

    // Translations served by bolls.life
    private let bollsTranslations = Set(["nrsvce", "cnbb"])

    // MARK: Public API

    func fetchChapter(book: String, chapter: Int, translation: String) async throws -> BibleChapter {
        let cacheKey = "\(book)-\(chapter)-\(translation)"
        if let cached = cache[cacheKey] { return cached }

        let result: BibleChapter

        let apiKey = ProcessInfo.processInfo.environment["API_BIBLE_KEY"] ?? ""
        let hasApiKey = !apiKey.isEmpty

        if bollsTranslations.contains(translation.lowercased()) {
            // Always use bolls.life for these translations
            result = try await fetchFromBolls(book: book, chapter: chapter, translation: translation)
        } else if hasApiKey, let apiBibleId = apiBibleIds[translation.lowercased()] {
            // Use API.bible when a key is present, fall back to bolls.life on failure
            do {
                result = try await fetchFromApiBible(book: book, chapter: chapter, bibleId: apiBibleId, translation: translation)
            } catch {
                result = try await fetchFromBolls(book: book, chapter: chapter, translation: translation)
            }
        } else {
            // No API key — go straight to bolls.life
            result = try await fetchFromBolls(book: book, chapter: chapter, translation: translation)
        }

        cache[cacheKey] = result
        return result
    }

    // MARK: API.bible

    private func fetchFromApiBible(book: String, chapter: Int, bibleId: String, translation: String) async throws -> BibleChapter {
        // Build chapter ID: e.g. "GEN.1"
        let bookCode = apiBibleBookCode(book)
        let chapterId = "\(bookCode).\(chapter)"
        let apiKey = ProcessInfo.processInfo.environment["API_BIBLE_KEY"] ?? ""

        var components = URLComponents(string: "https://api.scripture.api.bible/v1/bibles/\(bibleId)/chapters/\(chapterId)")!
        components.queryItems = [
            .init(name: "content-type", value: "json"),
            .init(name: "include-notes", value: "false"),
            .init(name: "include-titles", value: "true"),
            .init(name: "include-chapter-numbers", value: "false"),
            .init(name: "include-verse-numbers", value: "true"),
            .init(name: "include-verse-spans", value: "false"),
        ]

        var request = URLRequest(url: components.url!)
        request.setValue(apiKey, forHTTPHeaderField: "api-key")

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ApiBibleChapterResponse.self, from: data)
        return parseApiBibleContent(response.data, book: book, chapter: chapter, translation: translation)
    }

    // MARK: bolls.life

    private func fetchFromBolls(book: String, chapter: Int, translation: String) async throws -> BibleChapter {
        let bookNum = bollsBookNumber(book)
        let trans = translation.uppercased()
        let url = URL(string: "https://bolls.life/get-chapter/\(trans)/\(bookNum)/\(chapter)/")!

        let (data, _) = try await URLSession.shared.data(from: url)
        let verses = try JSONDecoder().decode([BollsVerse].self, from: data)

        return BibleChapter(
            book: book,
            chapter: chapter,
            translation: translation,
            verses: verses.map { v in
                BibleVerse(
                    id: v.verse,
                    number: String(v.verse),
                    text: v.text.trimmingCharacters(in: .whitespacesAndNewlines)
                )
            }
        )
    }

    // MARK: Parsing Helpers

    private func parseApiBibleContent(_ data: ApiBibleChapterData, book: String, chapter: Int, translation: String) -> BibleChapter {
        // API.bible returns an array of items with type "verse", "title", etc.
        var verses: [BibleVerse] = []
        var pendingHeading: String?

        for item in data.content ?? [] {
            if item.type == "title" {
                pendingHeading = item.items?.compactMap { $0.text }.joined(separator: " ")
            } else if item.type == "verse" {
                let verseNum = Int(item.number ?? "0") ?? 0
                let text = item.items?.compactMap { $0.text }.joined(separator: " ")
                    .replacingOccurrences(of: "¶ ", with: "")
                    .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

                var verse = BibleVerse(id: verseNum, number: item.number ?? String(verseNum), text: text)
                verse.heading = pendingHeading
                pendingHeading = nil
                verses.append(verse)
            }
        }

        return BibleChapter(book: book, chapter: chapter, translation: translation, verses: verses)
    }

    // MARK: Book Code Tables

    private func apiBibleBookCode(_ book: String) -> String {
        let codes: [String: String] = [
            "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM",
            "Deuteronomy": "DEU", "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT",
            "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
            "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH",
            "Esther": "EST", "Job": "JOB", "Psalms": "PSA", "Proverbs": "PRO",
            "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA", "Jeremiah": "JER",
            "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS",
            "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
            "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP",
            "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL",
            "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
            "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO",
            "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL",
            "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI",
            "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB",
            "James": "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN",
            "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV",
        ]
        return codes[book] ?? book.uppercased().prefix(3).description
    }

    private func bollsBookNumber(_ book: String) -> Int {
        let numbers: [String: Int] = [
            "Genesis": 1, "Exodus": 2, "Leviticus": 3, "Numbers": 4, "Deuteronomy": 5,
            "Joshua": 6, "Judges": 7, "Ruth": 8, "1 Samuel": 9, "2 Samuel": 10,
            "1 Kings": 11, "2 Kings": 12, "1 Chronicles": 13, "2 Chronicles": 14,
            "Ezra": 15, "Nehemiah": 16, "Tobit": 17, "Judith": 18, "Esther": 19,
            "1 Maccabees": 20, "2 Maccabees": 21, "Job": 22, "Psalms": 23,
            "Proverbs": 24, "Ecclesiastes": 25, "Song of Solomon": 26, "Wisdom": 27,
            "Sirach": 28, "Isaiah": 29, "Jeremiah": 30, "Lamentations": 31, "Baruch": 32,
            "Ezekiel": 33, "Daniel": 34, "Hosea": 35, "Joel": 36, "Amos": 37,
            "Obadiah": 38, "Jonah": 39, "Micah": 40, "Nahum": 41, "Habakkuk": 42,
            "Zephaniah": 43, "Haggai": 44, "Zechariah": 45, "Malachi": 46,
            "Matthew": 47, "Mark": 48, "Luke": 49, "John": 50, "Acts": 51,
            "Romans": 52, "1 Corinthians": 53, "2 Corinthians": 54, "Galatians": 55,
            "Ephesians": 56, "Philippians": 57, "Colossians": 58, "1 Thessalonians": 59,
            "2 Thessalonians": 60, "1 Timothy": 61, "2 Timothy": 62, "Titus": 63,
            "Philemon": 64, "Hebrews": 65, "James": 66, "1 Peter": 67, "2 Peter": 68,
            "1 John": 69, "2 John": 70, "3 John": 71, "Jude": 72, "Revelation": 73,
        ]
        return numbers[book] ?? 1
    }
}

// MARK: - API Response Models (private)

private struct ApiBibleChapterResponse: Decodable {
    let data: ApiBibleChapterData
}

private struct ApiBibleChapterData: Decodable {
    let content: [ApiBibleContentItem]?
}

private struct ApiBibleContentItem: Decodable {
    let type: String?
    let number: String?
    let items: [ApiBibleTextItem]?
}

private struct ApiBibleTextItem: Decodable {
    let text: String?
}

private struct BollsVerse: Decodable {
    let verse: Int
    let text: String
}
