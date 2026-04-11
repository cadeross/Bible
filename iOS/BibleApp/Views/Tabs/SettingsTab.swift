import SwiftUI
import ClerkKitUI

// MARK: - Settings Tab
// Combines reading preferences + user profile/auth

struct SettingsTab: View {
    @Environment(AuthService.self) private var auth
    @Environment(ReadingPreferences.self) private var prefs
    @State private var showAppearance = false
    @State private var showSignIn = false

    var body: some View {
        @Bindable var prefs = prefs

        NavigationStack {
            Form {
                // MARK: Account
                Section("Account") {
                    if auth.isSignedIn {
                        HStack {
                            Image(systemName: "person.crop.circle.fill")
                                .font(.title2)
                                .foregroundStyle(.secondary)
                            VStack(alignment: .leading) {
                                Text(auth.displayName ?? "Signed In")
                                    .font(.headline)
                                Text("Cloud sync enabled")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Button("Sign Out", role: .destructive) {
                            Task { await auth.signOut() }
                        }
                    } else {
                        Button("Sign In to Sync") {
                            showSignIn = true
                        }
                        Text("Sign in to sync highlights and notes across all your devices.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                // MARK: Reading
                Section("Reading") {
                    Button("Appearance") {
                        showAppearance = true
                    }
                    .foregroundStyle(.primary)

                    Picker("Bible Version", selection: $prefs.bibleVersion) {
                        ForEach(BibleTranslation.all) { translation in
                            Text(translation.id.uppercased()).tag(translation.id)
                        }
                    }
                }

                // MARK: About
                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showAppearance) {
                AppearancePanel()
            }
            .sheet(isPresented: $showSignIn, onDismiss: {
                auth.syncFromClerk()
            }) {
                AuthView()
            }
        }
    }
}
