import Foundation

/// Request to create a new challenge
public struct CreateChallengeRequest: Codable, Sendable {
    public let name: String
    public let target: Int
    public let timeframeType: TimeframeType
    public let startDate: String?
    public let endDate: String?
    public let color: String?
    public let icon: String?
    public let isPublic: Bool?
    // Count configuration
    public let countType: CountType?
    public let unitLabel: String?
    public let defaultIncrement: Int?
    
    public init(
        name: String,
        target: Int,
        timeframeType: TimeframeType,
        startDate: String? = nil,
        endDate: String? = nil,
        color: String? = nil,
        icon: String? = nil,
        isPublic: Bool? = nil,
        countType: CountType? = nil,
        unitLabel: String? = nil,
        defaultIncrement: Int? = nil
    ) {
        self.name = name
        self.target = target
        self.timeframeType = timeframeType
        self.startDate = startDate
        self.endDate = endDate
        self.color = color
        self.icon = icon
        self.isPublic = isPublic
        self.countType = countType
        self.unitLabel = unitLabel
        self.defaultIncrement = defaultIncrement
    }
}

/// Request to update an existing challenge
public struct UpdateChallengeRequest: Codable, Sendable {
    public let name: String?
    public let target: Int?
    public let color: String?
    public let icon: String?
    public let isPublic: Bool?
    public let isArchived: Bool?
    
    public init(
        name: String? = nil,
        target: Int? = nil,
        color: String? = nil,
        icon: String? = nil,
        isPublic: Bool? = nil,
        isArchived: Bool? = nil
    ) {
        self.name = name
        self.target = target
        self.color = color
        self.icon = icon
        self.isPublic = isPublic
        self.isArchived = isArchived
    }
}

/// Request to create a new entry
public struct CreateEntryRequest: Codable, Sendable {
    public let challengeId: String
    public let date: String
    public let count: Int
    public let sets: [Int]?
    public let note: String?
    public let feeling: Feeling?
    
    public init(
        challengeId: String,
        date: String,
        count: Int,
        sets: [Int]? = nil,
        note: String? = nil,
        feeling: Feeling? = nil
    ) {
        self.challengeId = challengeId
        self.date = date
        self.count = count
        self.sets = sets
        self.note = note
        self.feeling = feeling
    }
}

/// Request to update an existing entry
public struct UpdateEntryRequest: Codable, Sendable {
    public let date: String?
    public let count: Int?
    public let sets: [Int]?
    public let note: String?
    public let feeling: Feeling?
    
    public init(
        date: String? = nil,
        count: Int? = nil,
        sets: [Int]? = nil,
        note: String? = nil,
        feeling: Feeling? = nil
    ) {
        self.date = date
        self.count = count
        self.sets = sets
        self.note = note
        self.feeling = feeling
    }
}
