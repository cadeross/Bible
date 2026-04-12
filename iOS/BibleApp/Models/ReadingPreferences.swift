import SwiftUI

// MARK: - Font Family

enum FontFamily: String, CaseIterable, Codable, Sendable {
    case serif = "serif"
    case sans = "sans"
    case mono = "mono"

    var uiFont: UIFont {
        switch self {
        case .serif: return UIFont(name: "Georgia", size: 18) ?? .systemFont(ofSize: 18)
        case .sans:  return .systemFont(ofSize: 18, weight: .regular)
        case .mono:  return .monospacedSystemFont(ofSize: 18, weight: .regular)
        }
    }

    func font(size: CGFloat) -> UIFont {
        switch self {
        case .serif: return UIFont(name: "Georgia", size: size) ?? .systemFont(ofSize: size)
        case .sans:  return .systemFont(ofSize: size, weight: .regular)
        case .mono:  return .monospacedSystemFont(ofSize: size, weight: .regular)
        }
    }

    var swiftUIFont: Font {
        switch self {
        case .serif: return .custom("Georgia", size: 18)
        case .sans:  return .system(size: 18, design: .default)
        case .mono:  return .system(size: 18, design: .monospaced)
        }
    }

    var displayName: String {
        switch self {
        case .serif: return "Serif"
        case .sans:  return "Sans"
        case .mono:  return "Mono"
        }
    }
}

// MARK: - Highlight Color

enum HighlightColor: String, CaseIterable, Codable, Sendable {
    case yellow, green, blue, pink, purple, orange

    /// Background color — matches web app rgba values
    var uiColor: UIColor {
        switch self {
        case .yellow: return UIColor(red: 1.00, green: 0.80, blue: 0.00, alpha: 0.28)
        case .green:  return UIColor(red: 0.20, green: 0.78, blue: 0.35, alpha: 0.26)
        case .blue:   return UIColor(red: 0.00, green: 0.48, blue: 1.00, alpha: 0.22)
        case .pink:   return UIColor(red: 1.00, green: 0.18, blue: 0.33, alpha: 0.20)
        case .purple: return UIColor(red: 0.69, green: 0.32, blue: 0.87, alpha: 0.22)
        case .orange: return UIColor(red: 1.00, green: 0.58, blue: 0.00, alpha: 0.26)
        }
    }

    /// Solid dot color for the picker UI
    var dotColor: Color {
        switch self {
        case .yellow: return Color(hex: "FFCC00")
        case .green:  return Color(hex: "34C759")
        case .blue:   return Color(hex: "007AFF")
        case .pink:   return Color(hex: "FF2D55")
        case .purple: return Color(hex: "AF52DE")
        case .orange: return Color(hex: "FF9500")
        }
    }

    /// Solid dot color for UIKit context menus
    var dotUIColor: UIColor {
        switch self {
        case .yellow: return UIColor(red: 1.00, green: 0.80, blue: 0.00, alpha: 1)
        case .green:  return UIColor(red: 0.20, green: 0.78, blue: 0.35, alpha: 1)
        case .blue:   return UIColor(red: 0.00, green: 0.48, blue: 1.00, alpha: 1)
        case .pink:   return UIColor(red: 1.00, green: 0.18, blue: 0.33, alpha: 1)
        case .purple: return UIColor(red: 0.69, green: 0.32, blue: 0.87, alpha: 1)
        case .orange: return UIColor(red: 1.00, green: 0.58, blue: 0.00, alpha: 1)
        }
    }

    var displayName: String { rawValue.capitalized }
}

// MARK: - Reading Preferences

@Observable
@MainActor
final class ReadingPreferences {
    var fontSize: Double = 18 {
        didSet { save() }
    }
    var fontFamily: FontFamily = .serif {
        didSet { save() }
    }
    var lineHeight: Double = 1.6 {
        didSet { save() }
    }
    var showVerseNumbers: Bool = true {
        didSet { save() }
    }
    var redLetters: Bool = true {
        didSet { save() }
    }
    var showTitles: Bool = true {
        didSet { save() }
    }
    var defaultHighlightColor: HighlightColor = .yellow {
        didSet { save() }
    }
    var bibleVersion: String = "dra" {
        didSet { save() }
    }

    // Computed UIFont for current settings
    func uiFont(scale: CGFloat = 1) -> UIFont {
        fontFamily.font(size: fontSize * scale)
    }

    // MARK: Persistence (UserDefaults)

    private static let key = "ReadingPreferences"

    init() {
        load()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: Self.key),
              let stored = try? JSONDecoder().decode(StoredPrefs.self, from: data)
        else { return }
        fontSize = stored.fontSize
        fontFamily = stored.fontFamily
        lineHeight = stored.lineHeight
        showVerseNumbers = stored.showVerseNumbers
        redLetters = stored.redLetters
        showTitles = stored.showTitles
        defaultHighlightColor = stored.defaultHighlightColor
        bibleVersion = stored.bibleVersion
    }

    private func save() {
        let stored = StoredPrefs(
            fontSize: fontSize,
            fontFamily: fontFamily,
            lineHeight: lineHeight,
            showVerseNumbers: showVerseNumbers,
            redLetters: redLetters,
            showTitles: showTitles,
            defaultHighlightColor: defaultHighlightColor,
            bibleVersion: bibleVersion
        )
        if let data = try? JSONEncoder().encode(stored) {
            UserDefaults.standard.set(data, forKey: Self.key)
        }
    }

    private struct StoredPrefs: Codable {
        var fontSize: Double
        var fontFamily: FontFamily
        var lineHeight: Double
        var showVerseNumbers: Bool
        var redLetters: Bool
        var showTitles: Bool
        var defaultHighlightColor: HighlightColor
        var bibleVersion: String
    }
}

// MARK: - Color + Hex Helper

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int         & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
