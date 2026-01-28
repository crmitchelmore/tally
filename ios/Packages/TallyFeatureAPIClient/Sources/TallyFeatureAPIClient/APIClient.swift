import Foundation
import TallyCore

/// HTTP client for Tally API with Bearer token authentication
public actor APIClient {
    /// Shared instance using app configuration
    public static let shared = APIClient()
    
    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    
    /// Base URL from configuration
    private var baseURL: String {
        Configuration.apiBaseURL
    }
    
    public init(session: URLSession = .shared) {
        self.session = session
        
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
    }
    
    // MARK: - Token Management
    
    /// Get Bearer token from Keychain
    private func getAuthToken() -> String? {
        KeychainService.shared.retrieveToken()
    }
    
    // MARK: - Request Building
    
    private func buildRequest(
        path: String,
        method: String,
        queryItems: [URLQueryItem]? = nil,
        body: Data? = nil
    ) throws -> URLRequest {
        var urlComponents = URLComponents(string: baseURL + path)
        urlComponents?.queryItems = queryItems?.isEmpty == false ? queryItems : nil
        
        guard let url = urlComponents?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add Bearer token if available
        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        return request
    }
    
    // MARK: - Request Execution
    
    private func execute<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }
        
        // Handle error responses
        if httpResponse.statusCode >= 400 {
            try handleErrorResponse(data: data, statusCode: httpResponse.statusCode)
        }
        
        // Decode successful response
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
    
    private func handleErrorResponse(data: Data, statusCode: Int) throws -> Never {
        // Try to decode API error response
        if let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data) {
            switch statusCode {
            case 400:
                throw APIError.validationFailed(errorResponse.error, details: errorResponse.details)
            case 401:
                throw APIError.notAuthenticated
            case 403:
                throw APIError.forbidden(errorResponse.error)
            case 404:
                throw APIError.notFound(errorResponse.error)
            case 500...599:
                throw APIError.serverError(errorResponse.error)
            default:
                throw APIError.httpError(statusCode: statusCode, message: errorResponse.error)
            }
        }
        
        // Fallback for non-JSON error responses
        let message = String(data: data, encoding: .utf8)
        throw APIError.httpError(statusCode: statusCode, message: message)
    }
    
    // MARK: - Challenges API
    
    /// List user's challenges with embedded stats
    public func listChallenges(includeArchived: Bool = false) async throws -> [ChallengeWithStats] {
        var queryItems: [URLQueryItem] = []
        if includeArchived {
            queryItems.append(URLQueryItem(name: "includeArchived", value: "true"))
        }
        
        let request = try buildRequest(path: "/api/v1/challenges", method: "GET", queryItems: queryItems)
        let response: ChallengesResponse = try await execute(request)
        return response.challenges
    }
    
    /// Get a specific challenge
    public func getChallenge(id: String) async throws -> Challenge {
        let request = try buildRequest(path: "/api/v1/challenges/\(id)", method: "GET")
        let response: ChallengeResponse = try await execute(request)
        return response.challenge
    }
    
    /// Create a new challenge
    public func createChallenge(_ data: CreateChallengeRequest) async throws -> Challenge {
        let body = try encoder.encode(data)
        let request = try buildRequest(path: "/api/v1/challenges", method: "POST", body: body)
        let response: ChallengeResponse = try await execute(request)
        return response.challenge
    }
    
    /// Update an existing challenge
    public func updateChallenge(id: String, data: UpdateChallengeRequest) async throws -> Challenge {
        let body = try encoder.encode(data)
        let request = try buildRequest(path: "/api/v1/challenges/\(id)", method: "PATCH", body: body)
        let response: ChallengeResponse = try await execute(request)
        return response.challenge
    }
    
    /// Archive a challenge
    public func archiveChallenge(id: String) async throws -> Challenge {
        try await updateChallenge(id: id, data: UpdateChallengeRequest(isArchived: true))
    }
    
    /// Delete a challenge
    public func deleteChallenge(id: String) async throws {
        let request = try buildRequest(path: "/api/v1/challenges/\(id)", method: "DELETE")
        let _: DeleteResponse = try await execute(request)
    }
    
    // MARK: - Entries API
    
    /// List entries (optionally filtered by challenge or date)
    public func listEntries(challengeId: String? = nil, date: String? = nil) async throws -> [Entry] {
        var queryItems: [URLQueryItem] = []
        if let challengeId = challengeId {
            queryItems.append(URLQueryItem(name: "challengeId", value: challengeId))
        }
        if let date = date {
            queryItems.append(URLQueryItem(name: "date", value: date))
        }
        
        let request = try buildRequest(path: "/api/v1/entries", method: "GET", queryItems: queryItems)
        let response: EntriesResponse = try await execute(request)
        return response.entries
    }
    
    /// Get a specific entry
    public func getEntry(id: String) async throws -> Entry {
        let request = try buildRequest(path: "/api/v1/entries/\(id)", method: "GET")
        let response: EntryResponse = try await execute(request)
        return response.entry
    }
    
    /// Create a new entry
    public func createEntry(_ data: CreateEntryRequest) async throws -> Entry {
        let body = try encoder.encode(data)
        let request = try buildRequest(path: "/api/v1/entries", method: "POST", body: body)
        let response: EntryResponse = try await execute(request)
        return response.entry
    }
    
    /// Update an existing entry
    public func updateEntry(id: String, data: UpdateEntryRequest) async throws -> Entry {
        let body = try encoder.encode(data)
        let request = try buildRequest(path: "/api/v1/entries/\(id)", method: "PATCH", body: body)
        let response: EntryResponse = try await execute(request)
        return response.entry
    }
    
    /// Delete an entry
    public func deleteEntry(id: String) async throws {
        let request = try buildRequest(path: "/api/v1/entries/\(id)", method: "DELETE")
        let _: DeleteResponse = try await execute(request)
    }
    
    // MARK: - Stats API
    
    /// Get stats for a specific challenge
    public func getChallengeStats(challengeId: String) async throws -> ChallengeStats {
        let request = try buildRequest(path: "/api/v1/stats/\(challengeId)", method: "GET")
        let response: StatsResponse = try await execute(request)
        return response.stats
    }
    
    /// Get dashboard statistics
    public func getDashboardStats() async throws -> DashboardStats {
        let request = try buildRequest(path: "/api/v1/stats/dashboard", method: "GET")
        let response: DashboardStatsResponse = try await execute(request)
        return response.stats
    }
    
    /// Get personal records
    public func getPersonalRecords() async throws -> PersonalRecords {
        let request = try buildRequest(path: "/api/v1/stats/records", method: "GET")
        let response: PersonalRecordsResponse = try await execute(request)
        return response.records
    }
    
    /// Get weekly summary
    public func getWeeklySummary() async throws -> WeeklySummary {
        let request = try buildRequest(path: "/api/v1/stats/weekly", method: "GET")
        let response: WeeklySummaryResponse = try await execute(request)
        return response.summary
    }
    
    // MARK: - Public Challenges (Community)
    
    /// List public challenges for community view
    public func listPublicChallenges(search: String? = nil) async throws -> [PublicChallenge] {
        var queryItems: [URLQueryItem] = []
        if let search = search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }
        let request = try buildRequest(path: "/api/v1/public/challenges", method: "GET", queryItems: queryItems.isEmpty ? nil : queryItems)
        let response: PublicChallengesResponse = try await execute(request)
        return response.challenges
    }
    
    /// List followed challenges
    public func listFollowedChallenges() async throws -> [PublicChallenge] {
        let request = try buildRequest(path: "/api/v1/public/challenges/following", method: "GET")
        let response: PublicChallengesResponse = try await execute(request)
        return response.challenges
    }
    
    /// Follow a challenge
    public func followChallenge(id: String) async throws {
        let request = try buildRequest(path: "/api/v1/public/challenges/\(id)/follow", method: "POST")
        let _: EmptyResponse = try await execute(request)
    }
    
    /// Unfollow a challenge
    public func unfollowChallenge(id: String) async throws {
        let request = try buildRequest(path: "/api/v1/public/challenges/\(id)/follow", method: "DELETE")
        let _: EmptyResponse = try await execute(request)
    }
    
    // MARK: - Export/Import
    
    /// Export user data
    public func exportData() async throws -> ExportDataResponse {
        let request = try buildRequest(path: "/api/v1/data/export", method: "GET")
        return try await execute(request)
    }
    
    /// Import user data
    public func importData(_ data: ImportDataRequest) async throws -> ImportDataResponse {
        let body = try encoder.encode(data)
        let request = try buildRequest(path: "/api/v1/data/import", method: "POST", body: body)
        return try await execute(request)
    }
}
