import SwiftUI

// MARK: - Scripture Search View
// Full-text verse search — presented as a sheet from the search circle.

struct ScriptureSearchView: View {
    @State private var query = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Search Scripture",
                systemImage: "magnifyingglass",
                description: Text("Full-text verse search coming soon.")
            )
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .searchable(text: $query, prompt: "Search scripture…")
        }
    }
}
