import SwiftUI

// MARK: - Appearance Panel Sheet
//
// Controls: font family, font size, line height, red letters, verse numbers, section headings

struct AppearancePanel: View {
    @Environment(ReadingPreferences.self) private var prefs
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var prefs = prefs

        NavigationStack {
            Form {
                // MARK: Font Family
                Section("Typeface") {
                    Picker("Font", selection: $prefs.fontFamily) {
                        ForEach(FontFamily.allCases, id: \.self) { family in
                            Text(family.displayName).tag(family)
                        }
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                }

                // MARK: Font Size
                Section("Font Size") {
                    HStack {
                        Image(systemName: "textformat.size.smaller")
                            .foregroundStyle(.secondary)
                        Slider(value: $prefs.fontSize, in: 12...36, step: 1)
                            .onChange(of: prefs.fontSize) { _, _ in HapticManager.selection() }
                        Image(systemName: "textformat.size.larger")
                            .foregroundStyle(.secondary)
                    }
                    Text("Preview: \(Int(prefs.fontSize))pt")
                        .font(.system(size: prefs.fontSize))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                }

                // MARK: Line Height
                Section("Line Spacing") {
                    HStack {
                        Image(systemName: "text.line.first.and.arrowtriangle.forward")
                            .foregroundStyle(.secondary)
                        Slider(value: $prefs.lineHeight, in: 1.2...2.0, step: 0.1)
                            .onChange(of: prefs.lineHeight) { _, _ in HapticManager.selection() }
                        Image(systemName: "text.line.last.and.arrowtriangle.forward")
                            .foregroundStyle(.secondary)
                    }
                    Text(String(format: "%.1f×", prefs.lineHeight))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                }

                // MARK: Display Toggles
                Section("Display") {
                    Toggle("Red Letter Text", isOn: $prefs.redLetters)
                    Toggle("Verse Numbers", isOn: $prefs.showVerseNumbers)
                    Toggle("Section Headings", isOn: $prefs.showTitles)
                }

                // MARK: Default Highlight Color
                Section("Default Highlight") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(HighlightColor.allCases, id: \.self) { color in
                                Button {
                                    prefs.defaultHighlightColor = color
                                    HapticManager.light()
                                } label: {
                                    ZStack {
                                        Circle()
                                            .fill(color.dotColor)
                                            .frame(width: 30, height: 30)
                                        if prefs.defaultHighlightColor == color {
                                            Image(systemName: "checkmark")
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundStyle(.white)
                                        }
                                    }
                                    .scaleEffect(prefs.defaultHighlightColor == color ? 1.15 : 1.0)
                                    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: prefs.defaultHighlightColor)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
            .navigationTitle("Appearance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
