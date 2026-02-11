import AppIntents

/// App Shortcuts provider for Tally
/// Makes intents discoverable in Shortcuts app and Siri
@available(iOS 17.0, *)
public struct TallyShortcutsProvider: AppShortcutsProvider {
    
    public static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddEntryIntent(),
            phrases: [
                "Add \(\.$count) to \(\.$challenge) in \(.applicationName)",
                "Log \(\.$count) on \(\.$challenge) with \(.applicationName)",
                "Add entry to \(\.$challenge) in \(.applicationName)",
                "Log \(\.$count) \(\.$challenge)",
                "Add tally to \(\.$challenge)"
            ],
            shortTitle: "Add Entry",
            systemImageName: "plus.circle"
        )
        
        AppShortcut(
            intent: GetChallengeProgressIntent(),
            phrases: [
                "How is \(\.$challenge) going in \(.applicationName)",
                "Check \(\.$challenge) progress with \(.applicationName)",
                "What's my \(\.$challenge) count",
                "Show \(\.$challenge) progress"
            ],
            shortTitle: "Check Progress",
            systemImageName: "chart.bar"
        )
    }
}
