import Foundation

public struct TallyAPI: Sendable {
  public enum APIError: Error {
    case invalidResponse
    case httpStatus(Int, Data)
  }

  public struct CreateEntryRequest: Codable, Sendable {
    public let challengeId: String
    public let date: String
    public let count: Double
    public let note: String?
    public let sets: [EntrySet]?
    public let feeling: FeelingType?

    public init(
      challengeId: String,
      date: String,
      count: Double,
      note: String? = nil,
      sets: [EntrySet]? = nil,
      feeling: FeelingType? = nil
    ) {
      self.challengeId = challengeId
      self.date = date
      self.count = count
      self.note = note
      self.sets = sets
      self.feeling = feeling
    }
  }

  public struct IdResponse: Codable, Sendable { public let id: String }
  public struct SuccessResponse: Codable, Sendable { public let success: Bool }

  public struct LeaderboardRow: Codable, Sendable {
    public let challenge: Challenge
    public let followers: Double
  }

  public let baseURL: URL
  public let urlSession: URLSession

  public init(baseURL: URL, urlSession: URLSession = .shared) {
    self.baseURL = baseURL
    self.urlSession = urlSession
  }

  public func getChallenges(token: String) async throws -> [Challenge] {
    return try await send(path: "/api/challenges", method: "GET", token: token, decode: [Challenge].self)
  }

  public func getPublicChallenges() async throws -> [Challenge] {
    return try await send(path: "/api/public/challenges", method: "GET", token: nil, decode: [Challenge].self)
  }

  public func getLeaderboard() async throws -> [LeaderboardRow] {
    return try await send(path: "/api/leaderboard", method: "GET", token: nil, decode: [LeaderboardRow].self)
  }

  public func getEntriesByChallenge(challengeId: String, token: String) async throws -> [Entry] {
    let path = "/api/entries?challengeId=\(urlEncode(challengeId))"
    return try await send(path: path, method: "GET", token: token, decode: [Entry].self)
  }

  public func createEntry(_ body: CreateEntryRequest, token: String) async throws -> String {
    let response = try await send(path: "/api/entries", method: "POST", token: token, body: body, decode: IdResponse.self)
    return response.id
  }

  public func deleteEntry(id: String, token: String) async throws -> Bool {
    let response = try await send(path: "/api/entries/\(urlEncode(id))", method: "DELETE", token: token, decode: SuccessResponse.self)
    return response.success
  }

  public func getFollowed(token: String) async throws -> [FollowedChallenge] {
    return try await send(path: "/api/followed", method: "GET", token: token, decode: [FollowedChallenge].self)
  }

  public func follow(challengeId: String, token: String) async throws -> String {
    struct Body: Codable, Sendable { let challengeId: String }
    let response = try await send(path: "/api/followed", method: "POST", token: token, body: Body(challengeId: challengeId), decode: IdResponse.self)
    return response.id
  }

  public func unfollow(idOrChallengeId: String, token: String) async throws -> Bool {
    let response = try await send(path: "/api/followed/\(urlEncode(idOrChallengeId))", method: "DELETE", token: token, decode: SuccessResponse.self)
    return response.success
  }

  private func send<T: Decodable>(
    path: String,
    method: String,
    token: String?,
    decode: T.Type
  ) async throws -> T {
    let (data, http) = try await raw(path: path, method: method, token: token, bodyData: nil)
    guard (200..<300).contains(http.statusCode) else { throw APIError.httpStatus(http.statusCode, data) }
    return try JSONDecoder().decode(T.self, from: data)
  }

  private func send<Body: Encodable, T: Decodable>(
    path: String,
    method: String,
    token: String?,
    body: Body,
    decode: T.Type
  ) async throws -> T {
    let data = try JSONEncoder().encode(body)
    let (responseData, http) = try await raw(path: path, method: method, token: token, bodyData: data)
    guard (200..<300).contains(http.statusCode) else { throw APIError.httpStatus(http.statusCode, responseData) }
    return try JSONDecoder().decode(T.self, from: responseData)
  }

  private func raw(
    path: String,
    method: String,
    token: String?,
    bodyData: Data?
  ) async throws -> (Data, HTTPURLResponse) {
    guard let url = URL(string: path, relativeTo: baseURL) else { throw APIError.invalidResponse }
    var request = URLRequest(url: url)
    request.httpMethod = method

    if let token {
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    if let bodyData {
      request.httpBody = bodyData
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    }

    let (data, response) = try await urlSession.data(for: request)
    guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
    return (data, http)
  }

  private func urlEncode(_ raw: String) -> String {
    raw.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? raw
  }
}
