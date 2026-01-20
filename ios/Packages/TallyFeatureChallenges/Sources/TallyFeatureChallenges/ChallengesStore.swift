import Foundation
import TallyCore
import TallyFeatureAPIClient

public struct ChallengeDraft: Equatable, Sendable {
    public var name: String
    public var targetNumber: Int
    public var color: String
    public var icon: String
    public var timeframeUnit: String
    public var startDate: String?
    public var endDate: String?
    public var year: Int
    public var isPublic: Bool

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

public struct ChallengeStats: Equatable, Sendable {
    public let total: Int
    public let daysActive: Int
    public let currentStreak: Int
    public let longestStreak: Int
    public let daysLeft: Int
    public let pacePerDay: Double
    public let requiredPerDay: Double

    public init(
        total: Int,
        daysActive: Int,
        currentStreak: Int,
        longestStreak: Int,
        daysLeft: Int,
        pacePerDay: Double,
        requiredPerDay: Double
    ) {
        self.total = total
        self.daysActive = daysActive
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.daysLeft = daysLeft
        self.pacePerDay = pacePerDay
        self.requiredPerDay = requiredPerDay
    }
}

@MainActor
public final class ChallengesStore: ObservableObject {
    public enum State: Equatable {
        case idle
        case loading
    }

    @Published public private(set) var challenges: [Challenge] = []
    @Published public private(set) var entries: [Entry] = []
    @Published public private(set) var syncStatus: SyncStatus = .offline
    @Published public private(set) var lastError: String?
    @Published public private(set) var state: State = .idle

    public let apiClient: APIClientProviding
    private let cache: ChallengesCache
    private var queue: [QueuedWrite] = []

    public init(apiClient: APIClientProviding, cache: ChallengesCache = .init()) {
        self.apiClient = apiClient
        self.cache = cache
        self.queue = cache.loadQueue()
        self.challenges = cache.loadChallenges()
        self.entries = cache.loadEntries()
        self.syncStatus = queue.isEmpty ? .offline : .queued(queue.count)
    }

    public func refresh(activeOnly: Bool) async {
        state = .loading
        syncStatus = .syncing
        do {
            let challenges = try await apiClient.fetchChallenges(activeOnly: activeOnly)
            let entries = try await apiClient.fetchEntries(challengeId: nil, date: nil)
            self.challenges = challenges
            self.entries = entries
            cache.saveChallenges(challenges)
            cache.saveEntries(entries)
            syncStatus = queue.isEmpty ? .upToDate : .queued(queue.count)
            lastError = nil
        } catch {
            syncStatus = queue.isEmpty ? .offline : .queued(queue.count)
            lastError = error.localizedDescription
        }
        state = .idle
    }

    public func syncQueuedWrites() async {
        guard !queue.isEmpty else {
            syncStatus = .upToDate
            return
        }
        syncStatus = .syncing
        do {
            try await processQueue()
            cache.saveQueue(queue)
            lastError = nil
            await refresh(activeOnly: true)
        } catch {
            syncStatus = .failed
            lastError = error.localizedDescription
        }
    }

    public func createChallenge(_ draft: ChallengeDraft) async {
        let request = ChallengeCreateRequest(
            name: draft.name,
            targetNumber: draft.targetNumber,
            color: draft.color,
            icon: draft.icon,
            timeframeUnit: draft.timeframeUnit,
            startDate: draft.startDate,
            endDate: draft.endDate,
            year: draft.year,
            isPublic: draft.isPublic
        )
        do {
            let created = try await apiClient.createChallenge(request)
            challenges.insert(created, at: 0)
            cache.saveChallenges(challenges)
            lastError = nil
            await track(
                event: .challengeCreated,
                properties: [
                    "challenge_id": created.id,
                    "timeframe_unit": created.timeframeUnit,
                    "target_number": "\(created.targetNumber)"
                ],
                userId: created.userId
            )
        } catch {
            queue.append(.createChallenge(request))
            cache.saveQueue(queue)
            syncStatus = .queued(queue.count)
            lastError = "Saved offline. We'll sync when you're online."
        }
    }

    public func updateChallenge(id: String, draft: ChallengeDraft) async {
        let request = ChallengeUpdateRequest(
            name: draft.name,
            targetNumber: draft.targetNumber,
            color: draft.color,
            icon: draft.icon,
            timeframeUnit: draft.timeframeUnit,
            startDate: draft.startDate,
            endDate: draft.endDate,
            year: draft.year,
            isPublic: draft.isPublic
        )
        do {
            let updated = try await apiClient.updateChallenge(id: id, request)
            replaceChallenge(updated)
            lastError = nil
            await track(
                event: updated.archived ? .challengeArchived : .challengeUpdated,
                properties: [
                    "challenge_id": updated.id,
                    "timeframe_unit": updated.timeframeUnit,
                    "target_number": "\(updated.targetNumber)"
                ],
                userId: updated.userId
            )
        } catch {
            queue.append(.updateChallenge(id: id, request))
            cache.saveQueue(queue)
            syncStatus = .queued(queue.count)
            lastError = "Update queued to sync."
        }
    }

    public func archiveChallenge(id: String) async {
        let request = ChallengeUpdateRequest(archived: true)
        do {
            let updated = try await apiClient.updateChallenge(id: id, request)
            replaceChallenge(updated)
            lastError = nil
            await track(
                event: .challengeArchived,
                properties: [
                    "challenge_id": updated.id,
                    "timeframe_unit": updated.timeframeUnit,
                    "target_number": "\(updated.targetNumber)"
                ],
                userId: updated.userId
            )
        } catch {
            queue.append(.updateChallenge(id: id, request))
            cache.saveQueue(queue)
            syncStatus = .queued(queue.count)
            lastError = "Archive queued to sync."
        }
    }

    public func deleteChallenge(id: String) async {
        let existing = challenges.first { $0.id == id }
        do {
            try await apiClient.deleteChallenge(id: id)
        } catch {
            queue.append(.deleteChallenge(id: id))
            cache.saveQueue(queue)
            syncStatus = .queued(queue.count)
            lastError = "Delete queued to sync."
        }
        challenges.removeAll { $0.id == id }
        entries.removeAll { $0.challengeId == id }
        cache.saveChallenges(challenges)
        cache.saveEntries(entries)
        if let challenge = existing {
            await track(
                event: .challengeArchived,
                properties: [
                    "challenge_id": challenge.id,
                    "timeframe_unit": challenge.timeframeUnit,
                    "target_number": "\(challenge.targetNumber)",
                    "archived": "true"
                ],
                userId: challenge.userId
            )
        }
    }

    private func track(event: TelemetryEvent, properties: [String: String], userId: String?) async {
        guard let contextProvider = TelemetryStore.shared.contextProvider,
              let client = TelemetryStore.shared.client else { return }
        let base = contextProvider()
        let context = TelemetryContext(
            platform: base.platform,
            env: base.env,
            appVersion: base.appVersion,
            buildNumber: base.buildNumber,
            userId: userId ?? base.userId,
            isSignedIn: true,
            sessionId: base.sessionId,
            traceId: base.traceId,
            spanId: base.spanId,
            requestId: base.requestId
        )
        await client.capture(event, properties: properties, context: context)
        await client.logWideEvent(event, properties: properties, context: context)
    }

    public func entriesForChallenge(_ challengeId: String) -> [Entry] {
        entries.filter { $0.challengeId == challengeId }
    }

    public func totalForChallenge(_ challengeId: String) -> Int {
        entriesForChallenge(challengeId).reduce(0) { $0 + $1.count }
    }

    public func stats(for challenge: Challenge) -> ChallengeStats {
        let total = totalForChallenge(challenge.id)
        let window = challengeWindow(for: challenge)
        let dailyTotals = buildDailyTotals(entries: entriesForChallenge(challenge.id))
        let streaks = computeStreaks(dailyTotals: dailyTotals, endDate: window.end)
        let today = startOfDay(Date())
        let daysLeft = max(0, daysBetween(start: today, end: window.endDate))
        let daysActive = streaks.daysActive
        let pacePerDay = daysActive > 0 ? Double(total) / Double(daysActive) : 0
        let remaining = max(0, challenge.targetNumber - total)
        let requiredPerDay = daysLeft > 0 ? Double(remaining) / Double(daysLeft) : Double(remaining)
        return ChallengeStats(
            total: total,
            daysActive: daysActive,
            currentStreak: streaks.current,
            longestStreak: streaks.longest,
            daysLeft: daysLeft,
            pacePerDay: pacePerDay,
            requiredPerDay: requiredPerDay
        )
    }

    public func heatmap(for challenge: Challenge) -> [HeatmapDay] {
        let window = challengeWindow(for: challenge)
        let totals = buildDailyTotals(entries: entriesForChallenge(challenge.id))
        var days: [HeatmapDay] = []
        var cursor = window.startDate
        while cursor <= window.endDate {
            let iso = isoDate(cursor)
            let count = totals[iso] ?? 0
            days.append(HeatmapDay(date: iso, count: count))
            cursor = addDays(cursor, 1)
        }
        return days
    }

    public var queuedCount: Int { queue.count }

    public var syncDescription: String {
        switch syncStatus {
        case .offline:
            return "Offline. Viewing cached data."
        case .syncing:
            return "Syncing with the server."
        case .queued(let count):
            return "\(count) updates queued to sync."
        case .upToDate:
            return "All caught up."
        case .failed:
            return "Sync failed. Try again when you are online."
        }
    }

    private func replaceChallenge(_ updated: Challenge) {
        if let index = challenges.firstIndex(where: { $0.id == updated.id }) {
            challenges[index] = updated
        } else {
            challenges.insert(updated, at: 0)
        }
        cache.saveChallenges(challenges)
    }

    private func processQueue() async throws {
        var remaining: [QueuedWrite] = []
        for write in queue {
            do {
                switch write {
                case .createChallenge(let request):
                    _ = try await apiClient.createChallenge(request)
                case .updateChallenge(let id, let request):
                    _ = try await apiClient.updateChallenge(id: id, request)
                case .deleteChallenge(let id):
                    _ = try await apiClient.deleteChallenge(id: id)
                }
            } catch {
                remaining.append(write)
            }
        }
        queue = remaining
    }

    private func challengeWindow(for challenge: Challenge) -> ChallengeWindow {
        if let startDate = challenge.startDate, let endDate = challenge.endDate {
            return ChallengeWindow(start: startDate, end: endDate)
        }
        if challenge.timeframeUnit == "year" {
            let start = "\(challenge.year)-01-01"
            let end = "\(challenge.year)-12-31"
            return ChallengeWindow(start: start, end: end)
        }
        if challenge.timeframeUnit == "month" {
            let base = challenge.startDate ?? challenge.endDate ?? isoDate(Date())
            let date = parseDate(base)
            let start = isoDate(startOfMonth(date))
            let end = isoDate(endOfMonth(date))
            return ChallengeWindow(start: start, end: end)
        }
        let fallbackStart = challenge.startDate ?? isoDate(Date())
        let fallbackEnd = challenge.endDate ?? fallbackStart
        return ChallengeWindow(start: fallbackStart, end: fallbackEnd)
    }
}

public struct HeatmapDay: Identifiable, Equatable, Sendable {
    public let id: String
    public let date: String
    public let count: Int

    public init(date: String, count: Int) {
        self.id = date
        self.date = date
        self.count = count
    }
}

public enum QueuedWrite: Codable, Equatable, Sendable {
    case createChallenge(ChallengeCreateRequest)
    case updateChallenge(id: String, ChallengeUpdateRequest)
    case deleteChallenge(id: String)
}

public final class ChallengesCache {
    private let challengesKey = "tally.challenges"
    private let entriesKey = "tally.challenge.entries"
    private let queueKey = "tally.challenge.queue"
    private let storage = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init() {}

    public func loadChallenges() -> [Challenge] {
        decode([Challenge].self, key: challengesKey) ?? []
    }

    public func loadEntries() -> [Entry] {
        decode([Entry].self, key: entriesKey) ?? []
    }

    public func loadQueue() -> [QueuedWrite] {
        decode([QueuedWrite].self, key: queueKey) ?? []
    }

    public func saveChallenges(_ challenges: [Challenge]) {
        encode(challenges, key: challengesKey)
    }

    public func saveEntries(_ entries: [Entry]) {
        encode(entries, key: entriesKey)
    }

    public func saveQueue(_ queue: [QueuedWrite]) {
        encode(queue, key: queueKey)
    }

    private func encode<T: Encodable>(_ value: T, key: String) {
        guard let data = try? encoder.encode(value) else { return }
        storage.set(data, forKey: key)
    }

    private func decode<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = storage.data(forKey: key) else { return nil }
        return try? decoder.decode(type, from: data)
    }
}

private struct ChallengeWindow {
    let start: String
    let end: String

    var startDate: Date { parseDate(start) }
    var endDate: Date { parseDate(end) }
}

private struct Streaks {
    let current: Int
    let longest: Int
    let daysActive: Int
}

private let daySeconds: TimeInterval = 24 * 60 * 60

private func parseDate(_ iso: String) -> Date {
    let components = iso.split(separator: "-").compactMap { Int($0) }
    guard components.count == 3 else { return Date() }
    var dateComponents = DateComponents()
    dateComponents.year = components[0]
    dateComponents.month = components[1]
    dateComponents.day = components[2]
    dateComponents.timeZone = TimeZone(secondsFromGMT: 0)
    return Calendar(identifier: .gregorian).date(from: dateComponents) ?? Date()
}

private func isoDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    return formatter.string(from: date)
}

private func addDays(_ date: Date, _ days: Int) -> Date {
    Calendar(identifier: .gregorian).date(byAdding: .day, value: days, to: date) ?? date
}

private func daysBetween(start: Date, end: Date) -> Int {
    let calendar = Calendar(identifier: .gregorian)
    return calendar.dateComponents([.day], from: start, to: end).day ?? 0
}

private func startOfMonth(_ date: Date) -> Date {
    let calendar = Calendar(identifier: .gregorian)
    let components = calendar.dateComponents([.year, .month], from: date)
    return calendar.date(from: components) ?? date
}

private func endOfMonth(_ date: Date) -> Date {
    let calendar = Calendar(identifier: .gregorian)
    guard let range = calendar.range(of: .day, in: .month, for: date) else { return date }
    return calendar.date(byAdding: .day, value: range.count - 1, to: startOfMonth(date)) ?? date
}

private func startOfDay(_ date: Date) -> Date {
    Calendar(identifier: .gregorian).startOfDay(for: date)
}

private func buildDailyTotals(entries: [Entry]) -> [String: Int] {
    var totals: [String: Int] = [:]
    for entry in entries {
        totals[entry.date, default: 0] += entry.count
    }
    return totals
}

private func computeStreaks(dailyTotals: [String: Int], endDate: String) -> Streaks {
    let dates = dailyTotals.keys.sorted()
    guard !dates.isEmpty else { return Streaks(current: 0, longest: 0, daysActive: 0) }
    let activeDates = Set(dates)
    var current = 0
    var cursor = parseDate(endDate)
    while activeDates.contains(isoDate(cursor)) {
        current += 1
        cursor = addDays(cursor, -1)
    }
    var longest = 0
    var run = 0
    var lastDate: Date?
    for date in dates {
        let currentDate = parseDate(date)
        if let lastDate {
            let diff = daysBetween(start: lastDate, end: currentDate)
            run = diff == 1 ? run + 1 : 1
        } else {
            run = 1
        }
        longest = max(longest, run)
        lastDate = currentDate
    }
    return Streaks(current: current, longest: longest, daysActive: dates.count)
}
