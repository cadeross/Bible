import SwiftUI

// MARK: - Reading View

struct ReadingView: View {
    @Bindable var vm: ReadingViewModel
    @Environment(ReadingPreferences.self) private var prefs

    var body: some View {
        ScrollView(.vertical) {
            Group {
                if vm.isLoading {
                    loadingView
                } else if let error = vm.error {
                    errorView(error)
                } else if let chapter = vm.bibleChapter {
                    chapterContent(chapter)
                } else {
                    loadingView
                }
            }
        }
        .scrollIndicators(.hidden)
        .overlay(alignment: .center) {
            if vm.isDragging && !vm.dragVerses.isEmpty {
                VerseSelectionBadge(count: vm.dragVerses.count)
            }
        }
        .gesture(chapterSwipeGesture)
        .sheet(isPresented: $vm.showAppearancePanel) {
            AppearancePanel()
        }
        .sheet(isPresented: $vm.showNoteSheet) {
            NoteSheet(vm: vm)
        }
        .popover(isPresented: $vm.showColorPicker) {
            HighlightColorPicker(vm: vm)
                .presentationCompactAdaptation(.popover)
        }
        .task {
            await vm.loadChapter(book: "Genesis", chapter: 1)
        }
    }

    // MARK: - Chapter Content

    private func chapterContent(_ chapter: BibleChapter) -> some View {
        ChapterTextView(
            chapter: chapter,
            highlights: vm.highlights,
            preferences: prefs,
            onVerseTap: { verse in
                vm.toggleHighlight(verse: verse, color: prefs.defaultHighlightColor)
            },
            onVerseLongPress: { verse, _ in
                HapticManager.heavy()
                vm.selectedVerses = [verse]
                vm.colorPickerAnchorVerse = verse
                vm.showColorPicker = true
            },
            onDragSelection: { verses in
                let wasEmpty = vm.dragVerses.isEmpty
                vm.dragVerses = verses
                vm.isDragging = !verses.isEmpty

                if !verses.isEmpty {
                    HapticManager.selection()
                } else if !wasEmpty {
                    vm.selectedVerses = vm.dragVerses
                    vm.showColorPicker = true
                }
            }
        )
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 32)
        .id("\(chapter.book)-\(chapter.chapter)")
        .transition(chapterTransition)
    }

    // MARK: - Chapter Transition

    private var chapterTransition: AnyTransition {
        .asymmetric(
            insertion: .move(edge: vm.navDirection > 0 ? .trailing : .leading).combined(with: .opacity),
            removal:   .move(edge: vm.navDirection > 0 ? .leading  : .trailing).combined(with: .opacity)
        )
    }

    // MARK: - Swipe Gesture

    private var chapterSwipeGesture: some Gesture {
        DragGesture(minimumDistance: 55, coordinateSpace: .local)
            .onEnded { value in
                let h = abs(value.translation.width)
                let v = abs(value.translation.height)
                guard h > v * 1.4 else { return }
                Task {
                    if value.translation.width < 0 { await vm.nextChapter() }
                    else { await vm.prevChapter() }
                }
            }
    }

    // MARK: - Loading & Error

    private var loadingView: some View {
        ProgressView()
            .frame(maxWidth: .infinity)
            .padding(.top, 120)
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("Could not load chapter")
                .font(.headline)
            Text(message)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Try Again") {
                Task { await vm.loadChapter(book: vm.book, chapter: vm.chapter) }
            }
            .buttonStyle(.bordered)
        }
        .padding(40)
    }
}
