import SwiftUI
import UIKit

// MARK: - Chapter Text View
//
// Renders all verses as a single flowing paragraph using UITextView (TextKit 1).
// Verse numbers appear as inline superscripts; highlights are background colors.
// Tap detection maps touch location → character index → verse ID via stored NSRanges.

struct ChapterTextView: View {
    let chapter: BibleChapter
    let highlights: [Highlight]
    let preferences: ReadingPreferences
    var onVerseTap: (Int) -> Void
    var onVerseLongPress: (Int, CGPoint) -> Void
    var onDragSelection: (Set<Int>) -> Void

    var body: some View {
        VerseTextView(
            chapter: chapter,
            highlights: highlights,
            preferences: preferences,
            onVerseTap: onVerseTap,
            onVerseLongPress: onVerseLongPress
        )
    }
}

// MARK: - UIViewRepresentable Wrapper

struct VerseTextView: UIViewRepresentable {
    let chapter: BibleChapter
    let highlights: [Highlight]
    let preferences: ReadingPreferences
    var onVerseTap: (Int) -> Void
    var onVerseLongPress: (Int, CGPoint) -> Void

    // MARK: makeUIView

    func makeUIView(context: Context) -> UITextView {
        // Explicitly construct TextKit 1 stack for reliable sizeThatFits
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

        // Long press gesture
        let longPress = UILongPressGestureRecognizer(target: context.coordinator,
                                                      action: #selector(Coordinator.handleLongPress(_:)))
        longPress.minimumPressDuration = 0.5
        textView.addGestureRecognizer(longPress)

        context.coordinator.textView = textView
        return textView
    }

    // MARK: updateUIView

    func updateUIView(_ textView: UITextView, context: Context) {
        var ranges: [Int: NSRange] = [:]
        let attrString = buildAttributedString(verseRanges: &ranges)
        textView.textStorage.setAttributedString(attrString)
        context.coordinator.verseRanges = ranges
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
                // Space between verses in paragraph flow
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

    class Coordinator: NSObject {
        weak var textView: UITextView?
        let parent: VerseTextView
        var verseRanges: [Int: NSRange] = [:]

        init(parent: VerseTextView) {
            self.parent = parent
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let textView else { return }
            let pt = gesture.location(in: textView)
            if let verseId = verse(at: pt, in: textView) {
                parent.onVerseTap(verseId)
            }
        }

        @objc func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
            guard gesture.state == .began, let textView else { return }
            let pt = gesture.location(in: textView)
            if let verseId = verse(at: pt, in: textView) {
                let globalPt = gesture.location(in: nil)
                parent.onVerseLongPress(verseId, globalPt)
            }
        }

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
