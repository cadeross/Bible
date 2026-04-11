import SwiftUI

// MARK: - Reading Accessory Bar
//
// Tab bar bottom accessory (like Apple Music's MiniPlayer).
// Shows current book · chapter · version with inline controls.

struct ReadingAccessoryBar: View {
    @Bindable var vm: ReadingViewModel
    @Environment(ReadingPreferences.self) private var prefs

    @State private var showBookPicker = false
    @State private var showChapterPicker = false
    @State private var showVersionPicker = false

    var body: some View {
        HStack(spacing: 0) {
            // Previous chapter
            Button {
                HapticManager.light()
                Task { await vm.prevChapter() }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.plain)

            Spacer()

            // Book
            Button { showBookPicker = true } label: {
                Text(vm.book)
                    .font(.system(size: 16, weight: .semibold))
            }
            .buttonStyle(.plain)

            Text("  ·  ")
                .foregroundStyle(.quaternary)
                .font(.system(size: 14))

            // Chapter
            Button { showChapterPicker = true } label: {
                Text("\(vm.chapter)")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)

            Text("  ·  ")
                .foregroundStyle(.quaternary)
                .font(.system(size: 14))

            // Version
            Button { showVersionPicker = true } label: {
                Text(prefs.bibleVersion.uppercased())
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)

            Spacer()

            // Next chapter
            Button {
                HapticManager.light()
                Task { await vm.nextChapter() }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 8)
        .sheet(isPresented: $showBookPicker) {
            BookPickerSheet(vm: vm)
        }
        .sheet(isPresented: $showChapterPicker) {
            ChapterPickerSheet(vm: vm)
        }
        .sheet(isPresented: $showVersionPicker) {
            VersionPickerSheet(vm: vm)
        }
    }
}

// MARK: - Book Picker Sheet

struct BookPickerSheet: View {
    @Bindable var vm: ReadingViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    private var filteredBooks: [BibleBook] {
        guard !search.isEmpty else { return BibleData.books }
        return BibleData.books.filter {
            $0.id.localizedCaseInsensitiveContains(search) ||
            $0.shortName.localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        NavigationStack {
            List(filteredBooks) { book in
                Button {
                    HapticManager.light()
                    Task { await vm.navigate(to: book.id, chapter: 1) }
                    dismiss()
                } label: {
                    HStack {
                        Text(book.displayName)
                            .foregroundStyle(vm.book == book.id ? Color.accentColor : .primary)
                        Spacer()
                        if vm.book == book.id {
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color.accentColor)
                        }
                        Text("\(book.chapterCount) ch")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                .buttonStyle(.plain)
            }
            .navigationTitle("Book")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $search, prompt: "Search books")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Chapter Picker Sheet

struct ChapterPickerSheet: View {
    @Bindable var vm: ReadingViewModel
    @Environment(\.dismiss) private var dismiss

    private var chapterCount: Int {
        BibleData.chapterCount(for: vm.book)
    }

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 6)

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(1...max(chapterCount, 1), id: \.self) { num in
                        Button {
                            HapticManager.medium()
                            Task { await vm.navigate(to: vm.book, chapter: num) }
                            dismiss()
                        } label: {
                            Text(String(num))
                                .font(.system(size: 14, weight: .medium))
                                .frame(maxWidth: .infinity)
                                .aspectRatio(1, contentMode: .fit)
                                .background(
                                    vm.chapter == num ? Color.accentColor : Color.secondary.opacity(0.12)
                                )
                                .foregroundStyle(vm.chapter == num ? .white : .primary)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(16)
            }
            .navigationTitle("\(vm.book) — Chapter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Version Picker Sheet

struct VersionPickerSheet: View {
    @Bindable var vm: ReadingViewModel
    @Environment(ReadingPreferences.self) private var prefs
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    private var filteredVersions: [BibleTranslation] {
        guard !search.isEmpty else { return BibleTranslation.all }
        return BibleTranslation.all.filter {
            $0.id.localizedCaseInsensitiveContains(search) ||
            $0.name.localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        NavigationStack {
            List(filteredVersions, id: \.id) { translation in
                Button {
                    HapticManager.light()
                    prefs.bibleVersion = translation.id
                    Task { await vm.loadChapter(book: vm.book, chapter: vm.chapter) }
                    dismiss()
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(translation.id.uppercased())
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(prefs.bibleVersion == translation.id ? Color.accentColor : .primary)
                            Text(translation.name)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if prefs.bibleVersion == translation.id {
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color.accentColor)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
            .navigationTitle("Translation")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $search, prompt: "Search translations")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
