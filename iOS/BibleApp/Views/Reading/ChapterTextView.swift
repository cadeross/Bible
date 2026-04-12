import SwiftUI
import UIKit

// MARK: - Chapter Text View
//
// Renders all verses as a single flowing paragraph using UITextView (TextKit 1).
// Verse numbers appear as inline superscripts; highlights are background colors.
// Tap detection maps touch location → character index → verse ID via stored NSRanges.
// Long-press uses native UIContextMenuInteraction anchored at the verse.

struct ChapterTextView: View {
    let chapter: BibleChapter
    let highlights: [Highlight]
    let preferences: ReadingPreferences
    var onVerseTap: (Int) -> Void
    var onHighlightColor: (Int, HighlightColor) -> Void
    var onRemoveHighlight: (Int) -> Void
    var onAddNote: (Int) -> Void
    var onCopyVerse: (Int) -> Void
    var onDragSelection: (Set<Int>) -> Void

    var body: some View {
        VerseTextView(
            chapter: chapter,
            highlights: highlights,
            preferences: preferences,
            onVerseTap: onVerseTap,
            onHighlightColor: onHighlightColor,
            onRemoveHighlight: onRemoveHighlight,
            onAddNote: onAddNote,
            onCopyVerse: onCopyVerse
        )
    }
}

// MARK: - UIViewRepresentable Wrapper

struct VerseTextView: UIViewRepresentable {
    let chapter: BibleChapter
    let highlights: [Highlight]
    let preferences: ReadingPreferences
    var onVerseTap: (Int) -> Void
    var onHighlightColor: (Int, HighlightColor) -> Void
    var onRemoveHighlight: (Int) -> Void
    var onAddNote: (Int) -> Void
    var onCopyVerse: (Int) -> Void

    // MARK: makeUIView

    func makeUIView(context: Context) -> UITextView {
        let textContainer = NSTextContainer(size: CGSize(width: CGFloat.greatestFiniteMagnitude,
                                                         height: CGFloat.greatestFiniteMagnitude))
        textContainer.widthTracksTextView = true
        textContainer.lineFragmentPadding = 0

        let layoutManager = NSLayoutManager()
        layoutManager.addTextContainer(textContainer)

        let storage = NSTextStorage()
        storage.addLayoutManager(layoutManager)

        let textView = UITextView(frame: .zero, textContainer: textContainer)
        textView.isEditable = false
        textView.isScrollEnabled = false
        textView.backgroundColor = .clear
        textView.textContainerInset = .zero
        textView.isSelectable = false
        textView.dataDetectorTypes = []

        // Tap gesture
        let tap = UITapGestureRecognizer(target: context.coordinator,
                                         action: #selector(Coordinator.handleTap(_:)))
        textView.addGestureRecognizer(tap)

        // Native context menu interaction (replaces long press gesture)
        let contextMenu = UIContextMenuInteraction(delegate: context.coordinator)
        textView.addInteraction(contextMenu)

        context.coordinator.textView = textView
        return textView
    }

    // MARK: updateUIView

    func updateUIView(_ textView: UITextView, context: Context) {
        var ranges: [Int: NSRange] = [:]
        let attrString = buildAttributedString(verseRanges: &ranges)
        textView.textStorage.setAttributedString(attrString)
        context.coordinator.verseRanges = ranges
        context.coordinator.parent = self
    }

    // MARK: sizeThatFits

    func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextView, context: Context) -> CGSize? {
        let width = proposal.width ?? UIScreen.main.bounds.width
        guard width > 0 else { return nil }

        uiView.textContainer.size = CGSize(width: width, height: CGFloat.greatestFiniteMagnitude)
        uiView.layoutManager.ensureLayout(for: uiView.textContainer)
        let usedRect = uiView.layoutManager.usedRect(for: uiView.textContainer)
        let height = ceil(usedRect.height)
        return CGSize(width: width, height: max(height, 20))
    }

    // MARK: Coordinator

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    // MARK: - Build NSAttributedString

    private func buildAttributedString(verseRanges: inout [Int: NSRange]) -> NSAttributedString {
        let result = NSMutableAttributedString()
        let bodySize = preferences.fontSize
        let numberSize = bodySize * 0.72

        let bodyFont: UIFont
        switch preferences.fontFamily {
        case .serif: bodyFont = UIFont(name: "Georgia", size: bodySize) ?? UIFont.systemFont(ofSize: bodySize)
        case .sans:  bodyFont = UIFont.systemFont(ofSize: bodySize)
        case .mono:  bodyFont = UIFont.monospacedSystemFont(ofSize: bodySize, weight: .regular)
        }

        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineSpacing = bodySize * (preferences.lineHeight - 1)

        for (index, verse) in chapter.verses.enumerated() {
            // --- Section heading ---
            if preferences.showTitles, let heading = verse.heading, !heading.isEmpty {
                if index > 0 {
                    result.append(NSAttributedString(string: "\n\n"))
                }
                let headingStyle = NSMutableParagraphStyle()
                headingStyle.paragraphSpacingBefore = 8
                headingStyle.paragraphSpacing = 4

                let headingAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: bodySize + 2, weight: .semibold),
                    .foregroundColor: UIColor.label,
                    .paragraphStyle: headingStyle,
                ]
                result.append(NSAttributedString(string: heading, attributes: headingAttrs))
                result.append(NSAttributedString(string: "\n"))
            } else if index > 0 {
                result.append(NSAttributedString(string: " "))
            }

            let verseStart = result.length

            // --- Verse number ---
            if preferences.showVerseNumbers {
                let numAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: numberSize, weight: .regular),
                    .foregroundColor: UIColor.secondaryLabel,
                    .baselineOffset: bodySize * 0.22,
                ]
                result.append(NSAttributedString(string: "\(verse.number)\u{2009}", attributes: numAttrs))
            }

            // --- Verse text ---
            let highlight = highlights.first { $0.verse == verse.id }
            let textColor: UIColor
            if preferences.redLetters && verse.isRedLetter {
                textColor = UIColor(red: 0.78, green: 0.10, blue: 0.10, alpha: 1.0)
            } else {
                textColor = UIColor.label
            }

            var textAttrs: [NSAttributedString.Key: Any] = [
                .font: bodyFont,
                .foregroundColor: textColor,
                .paragraphStyle: paragraphStyle,
            ]
            if let hl = highlight {
                textAttrs[.backgroundColor] = hl.color.uiColor
            }

            result.append(NSAttributedString(string: verse.text, attributes: textAttrs))

            verseRanges[verse.id] = NSRange(location: verseStart, length: result.length - verseStart)
        }

        return result
    }

    // MARK: - Coordinator

    @MainActor
    class Coordinator: NSObject, UIContextMenuInteractionDelegate {
        weak var textView: UITextView?
        var parent: VerseTextView
        var verseRanges: [Int: NSRange] = [:]

        init(parent: VerseTextView) {
            self.parent = parent
        }

        // MARK: Tap

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let textView else { return }
            let pt = gesture.location(in: textView)
            if let verseId = verse(at: pt, in: textView) {
                parent.onVerseTap(verseId)
            }
        }

        // MARK: Context Menu Delegate

        nonisolated func contextMenuInteraction(
            _ interaction: UIContextMenuInteraction,
            configurationForMenuAtLocation location: CGPoint
        ) -> UIContextMenuConfiguration? {
            MainActor.assumeIsolated {
                guard let textView else { return nil }
                guard let verseId = verse(at: location, in: textView) else { return nil }

                let currentHighlight = parent.highlights.first { $0.verse == verseId }

                return UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { [self] _ in
                    self.buildMenu(for: verseId, currentHighlight: currentHighlight)
                }
            }
        }

        nonisolated func contextMenuInteraction(
            _ interaction: UIContextMenuInteraction,
            configuration: UIContextMenuConfiguration,
            highlightPreviewForItemWithIdentifier identifier: any NSCopying
        ) -> UITargetedPreview? {
            // Return nil to use the default highlight behavior at the interaction point
            nil
        }

        // MARK: Build Menu

        private func buildMenu(for verseId: Int, currentHighlight: Highlight?) -> UIMenu {
            // Color actions
            let colorActions = HighlightColor.allCases.map { color in
                let isActive = currentHighlight?.color == color
                let image = UIImage(systemName: isActive ? "checkmark.circle.fill" : "circle.fill")?
                    .withTintColor(color.dotUIColor, renderingMode: .alwaysOriginal)

                return UIAction(
                    title: color.displayName,
                    image: image,
                    state: isActive ? .on : .off
                ) { [weak self] _ in
                    guard let self else { return }
                    MainActor.assumeIsolated {
                        if isActive {
                            self.parent.onRemoveHighlight(verseId)
                        } else {
                            self.parent.onHighlightColor(verseId, color)
                        }
                    }
                }
            }

            let colorsMenu = UIMenu(title: "", options: .displayInline, children: colorActions)

            // Remove highlight (if one exists)
            var actionItems: [UIMenuElement] = [colorsMenu]

            if currentHighlight != nil {
                let remove = UIAction(
                    title: "Remove Highlight",
                    image: UIImage(systemName: "xmark.circle"),
                    attributes: .destructive
                ) { [weak self] _ in
                    guard let self else { return }
                    MainActor.assumeIsolated {
                        self.parent.onRemoveHighlight(verseId)
                    }
                }
                actionItems.append(UIMenu(title: "", options: .displayInline, children: [remove]))
            }

            // Note, Copy, Share
            let note = UIAction(
                title: "Add Note",
                image: UIImage(systemName: "note.text")
            ) { [weak self] _ in
                guard let self else { return }
                MainActor.assumeIsolated {
                    self.parent.onAddNote(verseId)
                }
            }

            let copy = UIAction(
                title: "Copy",
                image: UIImage(systemName: "doc.on.doc")
            ) { [weak self] _ in
                guard let self else { return }
                MainActor.assumeIsolated {
                    self.parent.onCopyVerse(verseId)
                }
            }

            let share = UIAction(
                title: "Share",
                image: UIImage(systemName: "square.and.arrow.up")
            ) { [weak self] _ in
                guard let self else { return }
                MainActor.assumeIsolated {
                    self.parent.onCopyVerse(verseId) // copy as share fallback
                }
            }

            let actionsMenu = UIMenu(title: "", options: .displayInline, children: [note, copy, share])
            actionItems.append(actionsMenu)

            return UIMenu(title: "", children: actionItems)
        }

        // MARK: Verse Hit Test

        private func verse(at point: CGPoint, in textView: UITextView) -> Int? {
            let lm = textView.layoutManager
            let tc = textView.textContainer
            let glyphIndex = lm.glyphIndex(for: point, in: tc, fractionOfDistanceThroughGlyph: nil)
            let charIndex = lm.characterIndexForGlyph(at: glyphIndex)

            for (verseId, range) in verseRanges {
                if NSLocationInRange(charIndex, range) { return verseId }
            }
            return nil
        }
    }
}
