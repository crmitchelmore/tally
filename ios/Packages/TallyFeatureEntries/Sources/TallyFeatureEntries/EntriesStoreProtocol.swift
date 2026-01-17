import Foundation
import TallyCore
import TallyFeatureAPIClient

public protocol EntriesStoreProtocol: ObservableObject {
    var entries: [Entry] { get }
    var syncStatus: SyncStatus { get }
    var lastError: String? { get }

    func refreshEntries(activeOnly: Bool) async
    func syncQueuedWrites() async
    func createEntry(_ request: EntryCreateRequest) async
    func updateEntry(id: String, _ request: EntryUpdateRequest) async
    func deleteEntry(id: String) async
}
