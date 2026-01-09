import Foundation

public struct TallyAPI: Sendable {
  public enum APIError: Error {
    case invalidResponse
    case httpStatus(Int, Data)
  }

  public let baseURL: URL
  public let urlSession: URLSession

  public init(baseURL: URL, urlSession: URLSession = .shared) {
    self.baseURL = baseURL
    self.urlSession = urlSession
  }

  public func getChallenges(token: String) async throws -> [Challenge] {
    var request = URLRequest(url: baseURL.appending(path: "/api/challenges"))
    request.httpMethod = "GET"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let (data, response) = try await urlSession.data(for: request)
    guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
    guard (200..<300).contains(http.statusCode) else { throw APIError.httpStatus(http.statusCode, data) }

    return try JSONDecoder().decode([Challenge].self, from: data)
  }

  public func getPublicChallenges() async throws -> [Challenge] {
    var request = URLRequest(url: baseURL.appending(path: "/api/public/challenges"))
    request.httpMethod = "GET"

    let (data, response) = try await urlSession.data(for: request)
    guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
    guard (200..<300).contains(http.statusCode) else { throw APIError.httpStatus(http.statusCode, data) }

    return try JSONDecoder().decode([Challenge].self, from: data)
  }
}
