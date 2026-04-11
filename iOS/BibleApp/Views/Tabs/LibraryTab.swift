import SwiftUI
import SwiftData

// MARK: - Library Tab (Stub — Phase 3)
// Will show all highlights and notes, grouped by book, with search

struct LibraryTab: View {
    @Query private var highlights: [HighlightRecord]

    var body: some View {
        NavigationStack {
            if highlights.isEmpty {
                ContentUnavailableView(
                    "No Highlights Yet",
                    systemImage: "books.vertical",
                    description: Text("Tap any verse while reading to highlight it.")
                )
            } else {
                List(highlights, id: \.id) { record in
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(record.book) \(record.chapter):\(record.verse)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        if let note = record.note {
                            Text(note)
                                .font(.body)
                                .lineLimit(2)
                        }
                    }
                }
            }
        }
        .navigationTitle("Library")
    }
}
