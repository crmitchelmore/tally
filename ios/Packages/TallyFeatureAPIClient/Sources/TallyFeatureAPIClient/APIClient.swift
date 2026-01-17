import Foundation
import TallyCore

public enum APIClientError: LocalizedError, Equatable {
    case missingToken
    case invalidURL
    case invalidResponse
    case decodingFailed
    case encodingFailed
    case server(String)

    public var errorDescription: String? {
        switch self {
        case .missingToken:
            return "Missing auth token."
        case .invalidURL:
            return "Invalid API URL."
        case .invalidResponse:
            return "Unexpected server response."
        case .decodingFailed:
            return "Unable to decode response."
        case .encodingFailed:
            return "Unable to encode request."
        case .server(let message):
            return message
        }
    }
}

public protocol APIClientProviding: Sendable {
    func fetchChallenges(activeOnly: Bool) async throws -> [Challenge]
    func fetchEntries(challengeId: String?, date: String?) async throws -> [Entry]
    func createChallenge(_ request: ChallengeCreateRequest) async throws -> Challenge
    func updateChallenge(id: String, _ request: ChallengeUpdateRequest) async throws -> Challenge
    func createEntry(_ request: EntryCreateRequest) async throws -> Entry
    func updateEntry(id: String, _ request: EntryUpdateRequest) async throws -> Entry
    func deleteEntry(id: String) async throws
}

public struct APIClient: APIClientProviding {
    private let baseURL: URL
    private let tokenProvider: @Sendable () async throws -> String
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(
        baseURL: URL,
        tokenProvider: @escaping @Sendable () async throws -> String,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.tokenProvider = tokenProvider
        self.session = session
    }

    public func fetchChallenges(activeOnly: Bool) async throws -> [Challenge] {
        let url = try makeURL(path: "challenges", queryItems: [
            URLQueryItem(name: "active", value: activeOnly ? "true" : "false")
        ])
        return try await send(url: url, method: "GET", responseType: [Challenge].self)
    }

    public func fetchEntries(challengeId: String?, date: String?) async throws -> [Entry] {
        var items: [URLQueryItem] = []
        if let challengeId, !challengeId.isEmpty {
            items.append(URLQueryItem(name: "challengeId", value: challengeId))
        }
        if let date, !date.isEmpty {
            items.append(URLQueryItem(name: "date", value: date))
        }
        let url = try makeURL(path: "entries", queryItems: items.isEmpty ? nil : items)
        return try await send(url: url, method: "GET", responseType: [Entry].self)
    }

    public func createChallenge(_ request: ChallengeCreateRequest) async throws -> Challenge {
        let url = try makeURL(path: "challenges")
        return try await send(url: url, method: "POST", body: request, responseType: Challenge.self)
    }

    public func updateChallenge(id: String, _ request: ChallengeUpdateRequest) async throws -> Challenge {
        let url = try makeURL(path: "challenges/\(id)")
        return try await send(url: url, method: "PATCH", body: request, responseType: Challenge.self)
    }

    public func createEntry(_ request: EntryCreateRequest) async throws -> Entry {
        let url = try makeURL(path: "entries")
        return try await send(url: url, method: "POST", body: request, responseType: Entry.self)
    }

    public func updateEntry(id: String, _ request: EntryUpdateRequest) async throws -> Entry {
        let url = try makeURL(path: "entries/\(id)")
        return try await send(url: url, method: "PATCH", body: request, responseType: Entry.self)
    }

    public func deleteEntry(id: String) async throws {
        let url = try makeURL(path: "entries/\(id)")
        _ = try await send(url: url, method: "DELETE", responseType: EmptyResponse.self)
    }

    private func makeURL(path: String, queryItems: [URLQueryItem]? = nil) throws -> URL {
        guard var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false) else {
            throw APIClientError.invalidURL
        }
        components.queryItems = queryItems
        guard let url = components.url else {
            throw APIClientError.invalidURL
        }
        return url
    }

    private func send<Response: Decodable>(
        url: URL,
        method: String,
        responseType: Response.Type
    ) async throws -> Response {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let token = try await tokenProvider()
        guard !token.isEmpty else {
            throw APIClientError.missingToken
        }
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return try await perform(request: request, responseType: responseType)
    }

    private func send<Request: Encodable, Response: Decodable>(
        url: URL,
        method: String,
        body: Request,
        responseType: Response.Type
    ) async throws -> Response {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let token = try await tokenProvider()
        guard !token.isEmpty else {
            throw APIClientError.missingToken
        }
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        do {
            request.httpBody = try encoder.encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        } catch {
            throw APIClientError.encodingFailed
        }
        return try await perform(request: request, responseType: responseType)
    }

    private func perform<Response: Decodable>(
        request: URLRequest,
        responseType: Response.Type
    ) async throws -> Response {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Server error"
            throw APIClientError.server(message)
        }
        if Response.self == EmptyResponse.self {
            return EmptyResponse() as! Response
        }
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIClientError.decodingFailed
        }
    }
}

private struct EmptyResponse: Decodable {
    init() {}
}
