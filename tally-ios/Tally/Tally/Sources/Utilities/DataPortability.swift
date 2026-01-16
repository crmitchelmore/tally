import Foundation

/// Handles data export and import for user data portability
actor DataPortability {
    static let shared = DataPortability()
    
    private init() {}
    
    // MARK: - Export
    
    struct ExportData: Codable {
        let exportDate: Date
        let version: String
        let user: AuthUser?
        let challenges: [ChallengeResponse]
        let entries: [EntryResponse]
    }
    
    /// Export all user data as JSON string
    func exportAllData() async throws -> String {
        let challenges = try await APIClient.shared.getChallenges()
        var allEntries: [EntryResponse] = []
        
        for challenge in challenges {
            let entries = try await APIClient.shared.getEntries(challengeId: challenge.id)
            allEntries.append(contentsOf: entries)
        }
        
        let exportData = ExportData(
            exportDate: Date(),
            version: "1.0.0",
            user: AuthManager.shared.currentUser,
            challenges: challenges,
            entries: allEntries
        )
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        
        let data = try encoder.encode(exportData)
        guard let string = String(data: data, encoding: .utf8) else {
            throw DataPortabilityError.encodingFailed
        }
        
        return string
    }
    
    // MARK: - Import
    
    /// Import data from JSON string
    func importData(from jsonString: String) async throws {
        guard let data = jsonString.data(using: .utf8) else {
            throw DataPortabilityError.decodingFailed
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let importData = try decoder.decode(ExportData.self, from: data)
        
        // Import challenges
        for challenge in importData.challenges {
            _ = try await APIClient.shared.createChallenge(
                title: challenge.title,
                target: challenge.target,
                unit: challenge.unit,
                color: challenge.color,
                icon: challenge.icon,
                startDate: challenge.startDate,
                endDate: challenge.endDate,
                isPublic: challenge.isPublic
            )
        }
        
        // Note: Entries would need to be imported with their original challengeIds mapped
        // This is a simplified version - full implementation would need ID mapping
    }
}

enum DataPortabilityError: Error, LocalizedError {
    case encodingFailed
    case decodingFailed
    case importFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .encodingFailed:
            return "Failed to encode data for export"
        case .decodingFailed:
            return "Failed to decode import data"
        case .importFailed(let reason):
            return "Import failed: \(reason)"
        }
    }
}
