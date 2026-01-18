import Foundation

public struct Challenge: Codable, Equatable, Sendable {
    public let id: String
    public let userId: String
    public let name: String
    public let targetNumber: Int
    public let color: String
    public let icon: String
    public let timeframeUnit: String
    public let startDate: String?
    public let endDate: String?
    public let year: Int
    public let isPublic: Bool
    public let archived: Bool
    public let createdAt: String

    public init(
        id: String,
        userId: String,
        name: String,
        targetNumber: Int,
        color: String,
        icon: String,
        timeframeUnit: String,
        startDate: String?,
        endDate: String?,
        year: Int,
        isPublic: Bool,
        archived: Bool,
        createdAt: String
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.targetNumber = targetNumber
        self.color = color
        self.icon = icon
        self.timeframeUnit = timeframeUnit
        self.startDate = startDate
        self.endDate = endDate
        self.year = year
        self.isPublic = isPublic
        self.archived = archived
        self.createdAt = createdAt
    }
}

public struct EntrySet: Codable, Equatable, Sendable {
    public let reps: Int

    public init(reps: Int) {
        self.reps = reps
    }
}

public struct Entry: Codable, Equatable, Sendable {
    public let id: String
    public let userId: String
    public let challengeId: String
    public let date: String
    public let count: Int
    public let note: String?
    public let sets: [EntrySet]?
    public let feeling: String?
    public let createdAt: String

    public init(
        id: String,
        userId: String,
        challengeId: String,
        date: String,
        count: Int,
        note: String?,
        sets: [EntrySet]?,
        feeling: String?,
        createdAt: String
    ) {
        self.id = id
        self.userId = userId
        self.challengeId = challengeId
        self.date = date
        self.count = count
        self.note = note
        self.sets = sets
        self.feeling = feeling
        self.createdAt = createdAt
    }
}

public struct ChallengeCreateRequest: Codable, Equatable, Sendable {
    public let name: String
    public let targetNumber: Int
    public let color: String
    public let icon: String
    public let timeframeUnit: String
    public let startDate: String?
    public let endDate: String?
    public let year: Int
    public let isPublic: Bool

    public init(
        name: String,
        targetNumber: Int,
        color: String,
        icon: String,
        timeframeUnit: String,
        startDate: String?,
        endDate: String?,
        year: Int,
        isPublic: Bool
    ) {
        self.name = name
        self.targetNumber = targetNumber
        self.color = color
        self.icon = icon
        self.timeframeUnit = timeframeUnit
        self.startDate = startDate
        self.endDate = endDate
        self.year = year
        self.isPublic = isPublic
    }
}

public struct ChallengeUpdateRequest: Codable, Equatable, Sendable {
    public let name: String?
    public let targetNumber: Int?
    public let color: String?
    public let icon: String?
    public let timeframeUnit: String?
    public let startDate: String?
    public let endDate: String?
    public let year: Int?
    public let isPublic: Bool?
    public let archived: Bool?

    public init(
        name: String? = nil,
        targetNumber: Int? = nil,
        color: String? = nil,
        icon: String? = nil,
        timeframeUnit: String? = nil,
        startDate: String? = nil,
        endDate: String? = nil,
        year: Int? = nil,
        isPublic: Bool? = nil,
        archived: Bool? = nil
    ) {
        self.name = name
        self.targetNumber = targetNumber
        self.color = color
        self.icon = icon
        self.timeframeUnit = timeframeUnit
        self.startDate = startDate
        self.endDate = endDate
        self.year = year
        self.isPublic = isPublic
        self.archived = archived
    }
}

public struct EntryCreateRequest: Codable, Equatable, Sendable {
    public let challengeId: String
    public let date: String
    public let count: Int
    public let note: String?
    public let sets: [EntrySet]?
    public let feeling: String?

    public init(
        challengeId: String,
        date: String,
        count: Int,
        note: String?,
        sets: [EntrySet]?,
        feeling: String?
    ) {
        self.challengeId = challengeId
        self.date = date
        self.count = count
        self.note = note
        self.sets = sets
        self.feeling = feeling
    }
}

public struct EntryUpdateRequest: Codable, Equatable, Sendable {
    public let date: String?
    public let count: Int?
    public let note: String?
    public let sets: [EntrySet]?
    public let feeling: String?

    public init(
        date: String? = nil,
        count: Int? = nil,
        note: String? = nil,
        sets: [EntrySet]? = nil,
        feeling: String? = nil
    ) {
        self.date = date
        self.count = count
        self.note = note
        self.sets = sets
        self.feeling = feeling
    }
}
