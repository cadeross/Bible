import SwiftUI
import ClerkKit

// MARK: - Reading View Model

@Observable
@MainActor
final class ReadingViewModel {
    // MARK: Navigation State
    var book: String = "Genesis"
    var chapter: Int = 1

    // MARK: Content State
    var bibleChapter: BibleChapter? = nil
    var isLoading: Bool = false
    var error: String? = nil

    // MARK: Highlight State
    var highlights: [Highlight] = []
    var selectedVerses: Set<Int> = []
    var isDragging: Bool = false
    var dragVerses: Set<Int> = []

    // MARK: UI State
    var isFocusMode: Bool = false
    var showColorPicker: Bool = false
    var colorPickerAnchorVerse: Int? = nil
    var showNoteSheet: Bool = false
    var noteTargetVerses: [Int] = []
    var showAppearancePanel: Bool = false
    var navDirection: Int = 1  // +1 forward, -1 backward (for transition direction)

    // MARK: Dependencies
    private let apiService = BibleAPIService.shared
    private let convexService = ConvexService.shared

    // Reading session tracking
    private var sessionStartTime: Date? = nil
    private var wordCount: Int = 0

    // MARK: - Navigation

    func loadChapter(book: String, chapter: Int, direction: Int = 1) async {
        navDirection = direction
        self.book = book
        self.chapter = chapter
        isLoading = true
        error = nil
        selectedVerses = []
        isDragging = false

        do {
            let translation = UserDefaults.standard.string(forKey: "bibleVersion") ?? "web"
            bibleChapter = try await apiService.fetchChapter(book: book, chapter: chapter, translation: translation)
            wordCount = bibleChapter?.verses.reduce(0) { $0 + $1.text.split(separator: " ").count } ?? 0
            await loadHighlights()
            sessionStartTime = .now
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func nextChapter() async {
        guard let next = ChapterNavigation.next(book: book, chapter: chapter) else { return }
        HapticManager.medium()
        await endSession()
        await loadChapter(book: next.book, chapter: next.chapter, direction: 1)
    }

    func prevChapter() async {
        guard let prev = ChapterNavigation.prev(book: book, chapter: chapter) else { return }
        HapticManager.medium()
        await endSession()
        await loadChapter(book: prev.book, chapter: prev.chapter, direction: -1)
    }

    func navigate(to book: String, chapter: Int) async {
        HapticManager.medium()
        await endSession()
        await loadChapter(book: book, chapter: chapter, direction: 1)
    }

    var canGoPrev: Bool { ChapterNavigation.canGoPrev(book: book, chapter: chapter) }
    var canGoNext: Bool { ChapterNavigation.canGoNext(book: book, chapter: chapter) }

    // MARK: - Highlights

    func loadHighlights() async {
        let token = await clerkToken()
        guard let token else { return }  // Unauthenticated → local highlights only
        do {
            let remote = try await convexService.listHighlights(book: book, chapter: chapter, token: token)
            if !remote.isEmpty {
                highlights = remote
            }
        } catch {
            // Silently fall back to existing local highlights
        }
    }

    func toggleHighlight(verse: Int, color: HighlightColor) {
        HapticManager.light()
        if let idx = highlights.firstIndex(where: { $0.verse == verse }) {
            if highlights[idx].color == color {
                highlights.remove(at: idx)
                syncRemoveHighlight(verse: verse)
            } else {
                highlights[idx].color = color
                syncSaveHighlight(highlights[idx])
            }
        } else {
            let hl = Highlight(book: book, chapter: chapter, verse: verse, color: color)
            highlights.append(hl)
            syncSaveHighlight(hl)
        }
    }

    func applyColor(_ color: HighlightColor, to verses: Set<Int>) {
        for verse in verses {
            toggleHighlight(verse: verse, color: color)
        }
        selectedVerses = []
        showColorPicker = false
    }

    func removeHighlight(verse: Int) {
        highlights.removeAll { $0.verse == verse }
        syncRemoveHighlight(verse: verse)
    }

    func highlight(for verse: Int) -> Highlight? {
        highlights.first { $0.verse == verse }
    }

    // MARK: - Convex Sync (fire-and-forget)

    private func syncSaveHighlight(_ highlight: Highlight) {
        Task {
            guard let token = await clerkToken() else { return }
            try? await convexService.saveHighlight(highlight, token: token)
        }
    }

    private func syncRemoveHighlight(verse: Int) {
        Task {
            guard let token = await clerkToken() else { return }
            try? await convexService.removeHighlight(book: book, chapter: chapter, verse: verse, token: token)
        }
    }

    private func clerkToken() async -> String? {
        guard let session = Clerk.shared.session else { return nil }
        return try? await session.getToken()
    }

    // MARK: - Focus Mode

    func toggleFocusMode() {
        isFocusMode.toggle()
        HapticManager.success()
    }

    // MARK: - Session Tracking

    func endSession() async {
        guard let start = sessionStartTime else { return }
        let duration = Int(Date().timeIntervalSince(start))
        guard duration >= 5 else { return }
        sessionStartTime = nil
        // Phase 2: save reading history to Convex
        _ = duration
        _ = wordCount
    }
}
