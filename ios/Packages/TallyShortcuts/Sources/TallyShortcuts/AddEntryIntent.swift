import AppIntents
import TallyFeatureAPIClient

/// App Intent for adding an entry to a challenge via Shortcuts/Siri
/// Example: "Log 5 on Push-ups" or "Add 10 to Reading"
@available(iOS 17.0, *)
public struct AddEntryIntent: AppIntent {
    
    public static var title: LocalizedStringResource = "Add Entry"
    public static var description = IntentDescription("Add a count to one of your challenges")
    
    /// The challenge to add the entry to
    @Parameter(title: "Challenge")
    public var challenge: ChallengeEntity
    
    /// The count to add
    @Parameter(title: "Count", default: 1)
    public var count: Int
    
    /// Optional note for the entry
    @Parameter(title: "Note")
    public var note: String?
    
    public init() {}
    
    public init(challenge: ChallengeEntity, count: Int, note: String? = nil) {
        self.challenge = challenge
        self.count = count
        self.note = note
    }
    
    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog {
        // Get today's date
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        let today = dateFormatter.string(from: Date())
        
        // Create the entry request
        let request = CreateEntryRequest(
            challengeId: challenge.id,
            date: today,
            count: count,
            sets: nil,
            note: note,
            feeling: nil
        )
        
        // Create the entry via API
        do {
            let entry = try await APIClient.shared.createEntry(request)
            
            let unitLabel = challenge.unitLabel ?? "entries"
            let message = "Added \(count) \(unitLabel) to \(challenge.name)"
            
            return .result(dialog: IntentDialog(stringLiteral: message))
        } catch {
            throw AddEntryError.failedToAdd(challenge.name, error.localizedDescription)
        }
    }
    
    public static var parameterSummary: some ParameterSummary {
        Summary("Add \(\.$count) to \(\.$challenge)") {
            \.$note
        }
    }
    
    /// Suggested invocation phrases for Siri
    public static var suggestedInvocationPhrase: String? {
        "Log entries in Tally"
    }
}

// MARK: - Errors

@available(iOS 17.0, *)
enum AddEntryError: Swift.Error, CustomLocalizedStringResourceConvertible {
    case failedToAdd(String, String)
    
    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .failedToAdd(let challenge, let reason):
            return "Failed to add entry to \(challenge): \(reason)"
        }
    }
}
