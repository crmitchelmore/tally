import SwiftUI
import Observation

@Observable
final class ChallengesStore {
    var challenges: [ChallengeResponse] = []
    var isLoading = false
    var error: String?
    
    private let apiClient = APIClient.shared
    
    func loadChallenges() async {
        isLoading = true
        error = nil
        
        do {
            challenges = try await apiClient.fetchChallenges()
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
            _ = try await apiClient.createChallenge(CreateChallengeRequest(
                name: name,
                targetNumber: targetNumber,
                color: color,
                icon: icon,
                timeframeUnit: timeframeUnit,
                year: year,
                isPublic: isPublic
            ))
            // Reload challenges after creating
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
    var entries: [String: [EntryResponse]] = [:] // keyed by challengeId
    var isLoading = false
    var error: String?
    
    private let apiClient = APIClient.shared
    
    func loadEntries(for challengeId: String) async {
        isLoading = true
        error = nil
        
        do {
            entries[challengeId] = try await apiClient.fetchEntries(challengeId: challengeId)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Failed to load entries"
        }
        
        isLoading = false
    }
    
    func createEntry(
        challengeId: String,
        date: Date,
        count: Int,
        note: String?,
        feeling: String?
    ) async {
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        let dateString = dateFormatter.string(from: date).prefix(10)
        
        do {
            _ = try await apiClient.createEntry(CreateEntryRequest(
                challengeId: challengeId,
                date: String(dateString),
                count: count,
                note: note,
                feeling: feeling
            ))
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
    
    private let apiClient = APIClient.shared
    
    func loadLeaderboard() async {
        isLoading = true
        error = nil
        
        do {
            entries = try await apiClient.fetchLeaderboard(timeRange: selectedTimeRange)
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
    
    private let apiClient = APIClient.shared
    
    func loadPublicChallenges() async {
        isLoading = true
        error = nil
        
        do {
            publicChallenges = try await apiClient.fetchPublicChallenges()
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Failed to load community challenges"
        }
        
        isLoading = false
    }
}
