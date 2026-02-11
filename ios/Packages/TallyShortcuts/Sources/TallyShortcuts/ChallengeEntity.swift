import AppIntents
import TallyFeatureAPIClient

/// Entity representing a Tally challenge for use in App Intents
@available(iOS 17.0, *)
public struct ChallengeEntity: AppEntity {
    
    public static var typeDisplayRepresentation: TypeDisplayRepresentation = "Challenge"
    
    public static var defaultQuery = ChallengeEntityQuery()
    
    public var id: String
    public var name: String
    public var target: Int
    public var currentCount: Int
    public var color: String
    public var unitLabel: String?
    
    public var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(name)",
            subtitle: "\(currentCount) / \(target)"
        )
    }
    
    public init(
        id: String,
        name: String,
        target: Int,
        currentCount: Int,
        color: String,
        unitLabel: String?
    ) {
        self.id = id
        self.name = name
        self.target = target
        self.currentCount = currentCount
        self.color = color
        self.unitLabel = unitLabel
    }
}

// MARK: - Entity Query

@available(iOS 17.0, *)
public struct ChallengeEntityQuery: EntityQuery {
    
    public init() {}
    
    public func entities(for identifiers: [String]) async throws -> [ChallengeEntity] {
        let challenges = try await APIClient.shared.listChallenges(includeArchived: false)
        return challenges
            .filter { identifiers.contains($0.challenge.id) }
            .map { mapToEntity($0) }
    }
    
    public func suggestedEntities() async throws -> [ChallengeEntity] {
        let challenges = try await APIClient.shared.listChallenges(includeArchived: false)
        return challenges.map { mapToEntity($0) }
    }
    
    public func defaultResult() async -> ChallengeEntity? {
        // Return the most recently active challenge as default
        let challenges = try? await APIClient.shared.listChallenges(includeArchived: false)
        return challenges?.first.map { mapToEntity($0) }
    }
    
    private func mapToEntity(_ challengeWithStats: ChallengeWithStats) -> ChallengeEntity {
        ChallengeEntity(
            id: challengeWithStats.challenge.id,
            name: challengeWithStats.challenge.name,
            target: challengeWithStats.challenge.target,
            currentCount: challengeWithStats.stats.totalCount,
            color: challengeWithStats.challenge.color,
            unitLabel: challengeWithStats.challenge.unitLabel
        )
    }
}

// MARK: - String Search

@available(iOS 17.0, *)
extension ChallengeEntityQuery: EntityStringQuery {
    
    public func entities(matching string: String) async throws -> [ChallengeEntity] {
        let challenges = try await APIClient.shared.listChallenges(includeArchived: false)
        
        let lowercasedQuery = string.lowercased()
        return challenges
            .filter { $0.challenge.name.lowercased().contains(lowercasedQuery) }
            .map { mapToEntity($0) }
    }
}
