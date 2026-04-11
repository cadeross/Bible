import SwiftUI

// MARK: - Highlight Color Picker Popover
//
// Appears after: long-press on a verse, drag-select completion
// Shows 6 color dots + note / copy / share actions

struct HighlightColorPicker: View {
    @Bindable var vm: ReadingViewModel
    @Environment(ReadingPreferences.self) private var prefs

    private var targetVerses: [Int] {
        vm.selectedVerses.isEmpty
            ? [vm.colorPickerAnchorVerse].compactMap { $0 }
            : vm.selectedVerses.sorted()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Color dots row
            HStack(spacing: 12) {
                ForEach(HighlightColor.allCases, id: \.self) { color in
                    colorDot(color)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)

            Divider()

            // Action buttons
            VStack(spacing: 0) {
                actionButton(icon: "note.text", label: "Add Note") {
                    vm.noteTargetVerses = targetVerses
                    vm.showNoteSheet = true
                    vm.showColorPicker = false
                }

                actionButton(icon: "doc.on.doc", label: "Copy") {
                    copyVerses()
                    vm.showColorPicker = false
                }

                actionButton(icon: "square.and.arrow.up", label: "Share") {
                    // Opens native share sheet in NoteSheet flow
                    vm.showColorPicker = false
                }
            }
            .padding(.vertical, 4)
        }
        .frame(minWidth: 240)
    }

    // MARK: - Color Dot

    private func colorDot(_ color: HighlightColor) -> some View {
        let isActive = targetVerses.allSatisfy { verse in
            vm.highlight(for: verse)?.color == color
        } && !targetVerses.isEmpty

        return Button {
            HapticManager.light()
            if isActive {
                // Remove highlights
                for verse in targetVerses { vm.removeHighlight(verse: verse) }
            } else {
                vm.applyColor(color, to: Set(targetVerses))
            }
            vm.showColorPicker = false
        } label: {
            ZStack {
                Circle()
                    .fill(color.dotColor)
                    .frame(width: 28, height: 28)
                if isActive {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            .scaleEffect(isActive ? 1.15 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.6), value: isActive)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Action Button

    private func actionButton(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(label, systemImage: icon)
                .font(.system(size: 15))
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.vertical, 11)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .background(Color.clear)
        .hoverEffect(.highlight)
    }

    // MARK: - Copy

    private func copyVerses() {
        guard let chapter = vm.bibleChapter else { return }
        let verses = targetVerses.sorted()
        let verseTexts = verses.compactMap { num in
            chapter.verses.first { $0.id == num }?.text
        }
        let joined = verseTexts.joined(separator: " ")
        let ref = verses.count == 1
            ? "\(vm.book) \(vm.chapter):\(verses[0])"
            : "\(vm.book) \(vm.chapter):\(verses.first ?? 0)–\(verses.last ?? 0)"
        UIPasteboard.general.string = "\"\(joined)\" — \(ref)"
        HapticManager.success()
    }
}

// MARK: - Verse Selection Badge
//
// Floating pill shown while dragging to select multiple verses

struct VerseSelectionBadge: View {
    let count: Int

    var body: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                Text("\(count) verse\(count == 1 ? "" : "s")")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.accentColor, in: Capsule())
                    .shadow(color: .black.opacity(0.2), radius: 8, y: 4)
                Spacer()
            }
            .padding(.bottom, 140)
        }
        .transition(.scale.combined(with: .opacity))
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: count)
        .allowsHitTesting(false)
    }
}
