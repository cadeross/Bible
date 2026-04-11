import SwiftUI

// MARK: - Search Tab (Stub — Phase 3)
// Will be a full-text scripture search with verse results

struct SearchTab: View {
    @State private var query = ""

    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Scripture Search",
                systemImage: "magnifyingglass",
                description: Text("Search any passage, verse, or keyword.")
            )
            .navigationTitle("Search")
            .searchable(text: $query, prompt: "Search scripture…")
        }
    }
}
