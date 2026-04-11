import SwiftUI

// MARK: - Note Sheet
//
// Full-screen sheet for adding/editing a note on one or more verses.
// Auto-saves after 600ms debounce; shows "saving"/"saved" status.

struct NoteSheet: View {
    @Bindable var vm: ReadingViewModel
    @Environment(ReadingPreferences.self) private var prefs
    @Environment(\.dismiss) private var dismiss

    @State private var noteText: String = ""
    @State private var saveStatus: SaveStatus = .idle
    @State private var saveTask: Task<Void, Never>? = nil
    @State private var showDeleteConfirm: Bool = false
    @FocusState private var textFieldFocused: Bool

    enum SaveStatus { case idle, saving, saved }

    private var targetVerses: [Int] { vm.noteTargetVerses.sorted() }

    private var verseRef: String {
        guard !targetVerses.isEmpty else { return "" }
        if targetVerses.count == 1 {
            return "\(vm.book) \(vm.chapter):\(targetVerses[0])"
        }
        return "\(vm.book) \(vm.chapter):\(targetVerses.first ?? 0)–\(targetVerses.last ?? 0)"
    }

    private var existingHighlight: Highlight? {
        targetVerses.first.flatMap { vm.highlight(for: $0) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Verse reference label
                    Text(verseRef)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 16)

                    // Verse preview
                    if let chapter = vm.bibleChapter {
                        versePreview(chapter: chapter)
                    }

                    // Note editor
                    ZStack(alignment: .topLeading) {
                        if noteText.isEmpty {
                            Text("Write a reflection...")
                                .foregroundStyle(.tertiary)
                                .font(.body)
                                .padding(.top, 8)
                                .padding(.leading, 4)
                        }
                        TextEditor(text: $noteText)
                            .font(.body)
                            .focused($textFieldFocused)
                            .scrollDisabled(true)
                            .frame(minHeight: 120)
                            .onChange(of: noteText) { _, _ in scheduleSave() }
                    }
                    .padding(.horizontal, 16)

                    // Word count
                    HStack {
                        Spacer()
                        Text("\(noteText.split(separator: " ").count) words")
                            .font(.caption2)
                            .foregroundStyle(.quaternary)
                    }
                    .padding(.horizontal, 16)
                }
                .padding(.top, 8)
            }
            .navigationTitle("Note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        saveNote()
                        dismiss()
                    }
                }

                ToolbarItem(placement: .principal) {
                    saveStatusBadge
                }

                ToolbarItem(placement: .destructiveAction) {
                    if existingHighlight?.note != nil {
                        Button(role: .destructive) {
                            if showDeleteConfirm {
                                deleteNote()
                            } else {
                                showDeleteConfirm = true
                                // Auto-reset after 3s
                                Task {
                                    try? await Task.sleep(for: .seconds(3))
                                    showDeleteConfirm = false
                                }
                            }
                        } label: {
                            Text(showDeleteConfirm ? "Confirm Delete" : "Delete")
                                .foregroundStyle(.red)
                        }
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear {
            noteText = existingHighlight?.note ?? ""
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                textFieldFocused = true
            }
        }
    }

    // MARK: - Verse Preview

    private func versePreview(chapter: BibleChapter) -> some View {
        let previewVerses = targetVerses.prefix(3).compactMap { num in
            chapter.verses.first { $0.id == num }
        }
        let accentColor = existingHighlight?.color.dotColor ?? Color.accentColor

        return VStack(alignment: .leading, spacing: 4) {
            ForEach(previewVerses) { verse in
                Text(verse.text)
                    .font(.system(size: 14))
                    .italic()
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
        .overlay(alignment: .leading) {
            RoundedRectangle(cornerRadius: 2)
                .fill(accentColor)
                .frame(width: 3)
                .padding(.vertical, 4)
        }
        .padding(.horizontal, 16)
    }

    // MARK: - Save Status Badge

    private var saveStatusBadge: some View {
        HStack(spacing: 4) {
            switch saveStatus {
            case .idle:
                EmptyView()
            case .saving:
                ProgressView().scaleEffect(0.7)
                Text("Saving…").font(.caption).foregroundStyle(.secondary)
            case .saved:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                    .font(.caption)
                Text("Saved").font(.caption).foregroundStyle(.secondary)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: saveStatus)
    }

    // MARK: - Save Logic

    private func scheduleSave() {
        saveTask?.cancel()
        saveStatus = .saving
        saveTask = Task {
            try? await Task.sleep(for: .milliseconds(600))
            guard !Task.isCancelled else { return }
            saveNote()
            saveStatus = .saved
            try? await Task.sleep(for: .seconds(2))
            guard !Task.isCancelled else { return }
            saveStatus = .idle
        }
    }

    private func saveNote() {
        for verse in targetVerses {
            if var hl = vm.highlight(for: verse) {
                hl.note = noteText.isEmpty ? nil : noteText
                vm.highlights.removeAll { $0.verse == verse }
                vm.highlights.append(hl)
            } else if !noteText.isEmpty {
                // Create a new "no-color" highlight just to hold the note
                vm.highlights.append(Highlight(
                    book: vm.book,
                    chapter: vm.chapter,
                    verse: verse,
                    color: .yellow,
                    note: noteText
                ))
            }
        }
    }

    private func deleteNote() {
        for verse in targetVerses {
            if var hl = vm.highlight(for: verse) {
                hl.note = nil
                vm.highlights.removeAll { $0.verse == verse }
                vm.highlights.append(hl)
            }
        }
        dismiss()
    }
}
