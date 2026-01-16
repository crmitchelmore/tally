import Foundation

/// API client for communicating with the Convex HTTP API
actor APIClient {
    static let shared = APIClient()
    
    private let baseURL: URL
    private var authToken: String?
    
    private init() {
        // Use the Convex deployment URL for HTTP actions
        // In production, this should come from environment or config
        self.baseURL = URL(string: ProcessInfo.processInfo.environment["CONVEX_HTTP_URL"] ?? "https://curious-panther-737.convex.site")!
    }
    
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    // MARK: - Challenges
    
    func fetchChallenges() async throws -> [ChallengeResponse] {
        let data = try await request(path: "/api/v1/challenges", method: "GET")
        let response = try JSONDecoder().decode(APIResponse<[ChallengeResponse]>.self, from: data)
        return response.data
    }
    
    func createChallenge(_ challenge: CreateChallengeRequest) async throws -> String {
        let body = try JSONEncoder().encode(challenge)
        let data = try await request(path: "/api/v1/challenges", method: "POST", body: body)
        let response = try JSONDecoder().decode(APIResponse<IDResponse>.self, from: data)
        return response.data.id
    }
    
    // MARK: - Entries
    
    func fetchEntries(challengeId: String) async throws -> [EntryResponse] {
        let data = try await request(path: "/api/v1/entries?challengeId=\(challengeId)", method: "GET")
        let response = try JSONDecoder().decode(APIResponse<[EntryResponse]>.self, from: data)
        return response.data
    }
    
    func createEntry(_ entry: CreateEntryRequest) async throws -> String {
        let body = try JSONEncoder().encode(entry)
        let data = try await request(path: "/api/v1/entries", method: "POST", body: body)
        let response = try JSONDecoder().decode(APIResponse<IDResponse>.self, from: data)
        return response.data.id
    }
    
    // MARK: - Public Challenges
    
    func fetchPublicChallenges() async throws -> [ChallengeResponse] {
        let data = try await request(path: "/api/v1/public-challenges", method: "GET", requiresAuth: false)
        let response = try JSONDecoder().decode(APIResponse<[ChallengeResponse]>.self, from: data)
        return response.data
    }
    
    // MARK: - Leaderboard
    
    func fetchLeaderboard(timeRange: String = "month", limit: Int = 50) async throws -> [LeaderboardEntry] {
        let data = try await request(path: "/api/v1/leaderboard?timeRange=\(timeRange)&limit=\(limit)", method: "GET", requiresAuth: false)
        let response = try JSONDecoder().decode(APIResponse<[LeaderboardEntry]>.self, from: data)
        return response.data
    }
    
    // MARK: - Auth
    
    func registerUser(email: String?, name: String?, avatarUrl: String?) async throws {
        let body = try JSONEncoder().encode(RegisterUserRequest(email: email, name: name, avatarUrl: avatarUrl))
        _ = try await request(path: "/api/v1/auth/user", method: "POST", body: body)
    }
    
    // MARK: - Private
    
    private func request(path: String, method: String, body: Data? = nil, requiresAuth: Bool = true) async throws -> Data {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if requiresAuth {
            guard let token = authToken else {
                throw APIError.unauthorized
            }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return data
        case 401:
            throw APIError.unauthorized
        case 400...499:
            throw APIError.clientError(httpResponse.statusCode)
        case 500...599:
            throw APIError.serverError(httpResponse.statusCode)
        default:
            throw APIError.networkError
        }
    }
}

// MARK: - API Types

struct APIResponse<T: Codable>: Codable {
    let data: T
}

struct IDResponse: Codable {
    let id: String
}

struct ChallengeResponse: Codable, Identifiable {
    let _id: String
    let name: String
    let targetNumber: Int
    let color: String
    let icon: String
    let timeframeUnit: String
    let year: Int
    let isPublic: Bool
    let archived: Bool
    let createdAt: Double
    
    var id: String { _id }
}

struct EntryResponse: Codable, Identifiable {
    let _id: String
    let challengeId: String
    let date: String
    let count: Int
    let note: String?
    let feeling: String?
    let createdAt: Double
    
    var id: String { _id }
}

struct LeaderboardEntry: Codable, Identifiable {
    let clerkId: String
    let name: String?
    let avatarUrl: String?
    let total: Int
    let rank: Int
    
    var id: String { clerkId }
}

struct CreateChallengeRequest: Codable {
    let name: String
    let targetNumber: Int
    let color: String
    let icon: String
    let timeframeUnit: String
    let year: Int
    let isPublic: Bool
}

struct CreateEntryRequest: Codable {
    let challengeId: String
    let date: String
    let count: Int
    let note: String?
    let feeling: String?
}

struct RegisterUserRequest: Codable {
    let email: String?
    let name: String?
    let avatarUrl: String?
}

// MARK: - Errors

enum APIError: Error, LocalizedError {
    case invalidURL
    case unauthorized
    case networkError
    case clientError(Int)
    case serverError(Int)
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .unauthorized:
            return "Please sign in to continue"
        case .networkError:
            return "Network error. Please check your connection."
        case .clientError(let code):
            return "Request error (\(code))"
        case .serverError(let code):
            return "Server error (\(code)). Please try again."
        case .decodingError:
            return "Failed to process response"
        }
    }
}
