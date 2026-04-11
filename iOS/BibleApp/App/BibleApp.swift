import SwiftUI
import SwiftData
import ClerkKit

@main
struct BibleApp: App {
    @State private var authService = AuthService()
    @State private var readingPreferences = ReadingPreferences()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authService)
                .environment(readingPreferences)
                .modelContainer(for: [HighlightRecord.self, ReadingHistoryRecord.self])
                .task {
                    // Configure Clerk once at app launch then load the cached session
                    Clerk.configure(publishableKey: "pk_test_c3RhYmxlLXJheS0zMS5jbGVyay5hY2NvdW50cy5kZXYk")
                    try? await Clerk.shared.refreshClient()
                    authService.syncFromClerk()
                }
        }
    }
}
