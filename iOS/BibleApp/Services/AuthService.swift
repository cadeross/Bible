import SwiftUI
import ClerkKit

// MARK: - Auth Service
//
// Wraps ClerkKit to provide auth state to the rest of the app.
// Call syncFromClerk() after app launch and after any sign-in/sign-out
// to update the observable state.

@Observable
@MainActor
final class AuthService {
    var isSignedIn: Bool = false
    var displayName: String? = nil

    // Pull the latest state from Clerk into our observable properties
    func syncFromClerk() {
        let session = Clerk.shared.session
        isSignedIn = session != nil
        if let user = session?.user {
            let first = user.firstName ?? ""
            let last  = user.lastName  ?? ""
            displayName = [first, last]
                .filter { !$0.isEmpty }
                .joined(separator: " ")
                .nilIfEmpty
                ?? user.emailAddresses.first?.emailAddress
        } else {
            displayName = nil
        }
    }

    // Returns a short-lived Clerk JWT suitable for Convex Authorization header.
    // Returns nil when the user is not signed in.
    func getToken() async -> String? {
        guard let session = Clerk.shared.session else { return nil }
        return try? await session.getToken()
    }

    func signOut() async {
        try? await Clerk.shared.auth.signOut()
        isSignedIn = false
        displayName = nil
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
