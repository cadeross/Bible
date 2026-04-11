import UIKit

// MARK: - Haptic Feedback Manager (mirrors src/lib/haptics.ts)

enum HapticManager {
    /// Light tap — verse tap (30ms equivalent)
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    /// Medium impact — chapter navigation
    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    /// Heavy impact — long-press menu
    static func heavy() {
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    }

    /// Success notification — focus mode toggle
    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    /// Selection changed — drag verse selection
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
