import SwiftUI
import TallyCore

struct PrivacyChoicesView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var analytics = PrivacyPreferences().analyticsEnabled
    @State private var diagnostics = PrivacyPreferences().diagnosticsEnabled

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("A little feedback helps Tally grow. Sharing is optional, and every feature works with both choices off. You can change these choices in Settings at any time.")
                }
                Section {
                    Toggle("Share usage analytics", isOn: $analytics)
                        .accessibilityIdentifier("privacy_analytics")
                    Text("Send feature-use events, app and device details, and a random device identifier to PostHog in the EU. If signed in, events are linked to your account ID. We never send goal names, notes, entry contents or screen recordings.")
                        .font(.footnote).foregroundStyle(.secondary)
                    Toggle("Share crash reports", isOn: $diagnostics)
                        .accessibilityIdentifier("privacy_diagnostics")
                    Text("Send crash details, stack traces and app and device information to Sentry to help fix problems. Screenshots, screen recordings and account details are excluded.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section {
                    Link("Read the privacy policy", destination: URL(string: "https://tally-tracker.app/privacy")!)
                    Text("No advertising or tracking across other apps. These choices control optional telemetry from this device; essential account, sync and security processing still works.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 12) {
                    Button("Save my choices") { save(analytics: analytics, diagnostics: diagnostics) }
                        .buttonStyle(.borderedProminent)
                        .frame(maxWidth: .infinity)
                        .accessibilityIdentifier("privacy_save")
                    Button("Continue without sharing") { save(analytics: false, diagnostics: false) }
                        .buttonStyle(.bordered)
                        .frame(maxWidth: .infinity)
                        .accessibilityIdentifier("privacy_decline")
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(.regularMaterial)
            }
            .navigationTitle("Your privacy choices")
            .navigationBarTitleDisplayMode(.inline)
        }
        .interactiveDismissDisabled(!PrivacyPreferences().hasChosen)
    }

    private func save(analytics: Bool, diagnostics: Bool) {
        PrivacyPreferences().save(analytics: analytics, diagnostics: diagnostics)
        Analytics.applyPrivacyChoice()
        Diagnostics.applyPrivacyChoice()
        dismiss()
    }
}
