import SwiftUI
import Observation

@Observable
final class ChallengesStore {
    var challenges: [ChallengeResponse] = []
    var isLoading = false
    var error: String?
    
    func loadChallenges() async {
        isLoading = true
        error = nil
        
        do {
            challenges = try await APIClient.shared.getChallenges()
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "An unexpected error occurred"
        }
        
        isLoading = false
    }
    
    func createChallenge(
        name: String,
        targetNumber: Int,
        color: String,
        icon: String,
        timeframeUnit: String,
        year: Int,
        isPublic: Bool
    ) async {
        do {
            _ = try await APIClient.shared.createChallenge(
                title: name,
                target: targetNumber,
                unit: timeframeUnit,
                color: color,
                icon: icon,
                startDate: Date(),
                endDate: nil,
                isPublic: isPublic
            )
            await loadChallenges()
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Failed to create challenge"
        }
    }
}

@Observable
final class EntriesStore {
    var entries: [String: [EntryResponse]] = [:]
    var isLoading = false
    var error: String?
    
    func loadEntries(for challengeId: String) async {
        isLoading = true
        error = nil
        
        do {
            entries[challengeId] = try await APIClient.shared.getEntries(challengeId: challengeId)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Failed to load entries"
        }
        
        isLoading = false
    }
    
    func createEntry(
        challengeId: String,
        count: Int = 1,
        note: String? = nil
    ) async {
        do {
            _ = try await APIClient.shared.createEntry(
                challengeId: challengeId,
                count: count,
                note: note
            )
            await loadEntries(for: challengeId)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Failed to create entry"
        }
    }
    
    func entriesForChallenge(_ challengeId: String) -> [EntryResponse] {
        entries[challengeId] ?? []
    }
    
    func totalCount(for challengeId: String) -> Int {
        entriesForChallenge(challengeId).reduce(0) { $0 + $1.count }
    }
}

@Observable
final class LeaderboardStore {
    var entries: [LeaderboardEntry] = []
    var isLoading = false
    var error: String?
    var selectedTimeRange = "month"
    
    func loadLeaderboard() async {
        isLoading = true
        error = nil
        
        do {
            entries = try await APIClient.shared.getLeaderboard(timeRange: selectedTimeRange)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Failed to load leaderboard"
        }
        
        isLoading = false
    }
}

@Observable
final class CommunityStore {
    var publicChallenges: [ChallengeResponse] = []
    var isLoading = false
    var error: String?
    
    func loadPublicChallenges() async {
        isLoading = true
        error = nil
        
        do {
            publicChallenges = try await APIClient.shared.getPublicChallenges()
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Failed to load community challenges"
        }
        
        isLoading = false
    }
}
