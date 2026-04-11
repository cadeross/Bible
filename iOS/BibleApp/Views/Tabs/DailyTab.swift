import SwiftUI

// MARK: - Daily Tab (Stub — Phase 3)
// Will show today's liturgical readings with tabs for Reading I, Psalm, Reading II, Gospel

struct DailyTab: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Daily Readings",
                systemImage: "sun.horizon",
                description: Text("Today's liturgical readings will appear here.")
            )
            .navigationTitle("Daily")
        }
    }
}
