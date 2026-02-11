import AppIntents
import TallyFeatureAPIClient

/// App Intent for getting a challenge's current progress
/// Example: "How many push-ups have I done?"
@available(iOS 17.0, *)
public struct GetChallengeProgressIntent: AppIntent {
    
    public static var title: LocalizedStringResource = "Get Challenge Progress"
    public static var description = IntentDescription("Get the current progress of a challenge")
    
    /// The challenge to check
    @Parameter(title: "Challenge")
    public var challenge: ChallengeEntity
    
    public init() {}
    
    public init(challenge: ChallengeEntity) {
        self.challenge = challenge
    }
    
    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog {
        // Fetch latest stats
        do {
            let challenges = try await APIClient.shared.listChallenges(includeArchived: false)
            guard let challengeData = challenges.first(where: { $0.challenge.id == challenge.id }) else {
                throw GetProgressError.challengeNotFound(challenge.name)
            }
            
            let stats = challengeData.stats
            let progress = Double(stats.totalCount) / Double(challengeData.challenge.target) * 100
            let progressString = String(format: "%.0f", progress)
            
            let message: String
            if stats.totalCount >= challengeData.challenge.target {
                message = "You've completed \(challenge.name) with \(stats.totalCount) out of \(challengeData.challenge.target)! 🎉"
            } else {
                message = "\(challenge.name): \(stats.totalCount) out of \(challengeData.challenge.target) (\(progressString)%). \(stats.remaining) to go!"
            }
            
            return .result(dialog: IntentDialog(stringLiteral: message))
        } catch {
            throw GetProgressError.failedToFetch(challenge.name, error.localizedDescription)
        }
    }
    
    public static var parameterSummary: some ParameterSummary {
        Summary("Get progress for \(\.$challenge)")
    }
}

@available(iOS 17.0, *)
enum GetProgressError: Swift.Error, CustomLocalizedStringResourceConvertible {
    case challengeNotFound(String)
    case failedToFetch(String, String)
    
    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .challengeNotFound(let name):
            return "Challenge '\(name)' not found"
        case .failedToFetch(let name, let reason):
            return "Failed to get progress for \(name): \(reason)"
        }
    }
}
