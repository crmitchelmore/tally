import SwiftUI
import TallyCore
import TallyFeatureAPIClient

public struct EntriesView<Store: EntriesStoreProtocol>: View {
    @ObservedObject private var store: Store
    private let challenge: Challenge

    @Environment(\.dismiss) private var dismiss
    @State private var isPresentingCreate = false
    @State private var editingEntry: Entry?
    @State private var deletingEntry: Entry?
    @State private var selectedDate: String?

    public init(store: Store, challenge: Challenge) {
        self.store = store
        self.challenge = challenge
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    headerCard
                    syncStatusCard
                    heatmapCard
                    entriesList
                }
                .padding(20)
            }
            .navigationTitle("Entries")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingCreate = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .task {
            await store.refreshEntries(activeOnly: true)
        }
        .sheet(isPresented: $isPresentingCreate) {
            EntryFormView(mode: .create(challengeId: challenge.id)) { data in
                let request = EntryCreateRequest(
                    challengeId: data.challengeId,
                    date: data.date,
                    count: data.count,
                    note: data.note,
                    sets: data.sets,
                    feeling: data.feeling
                )
                await store.createEntry(request)
            }
        }
        .sheet(item: $editingEntry) { entry in
            EntryFormView(mode: .edit(entry)) { data in
                let request = EntryUpdateRequest(
                    date: data.date,
                    count: data.count,
                    note: data.note,
                    sets: data.sets,
                    feeling: data.feeling
                )
                await store.updateEntry(id: entry.id, request)
            }
        }
        .alert("Delete entry?", isPresented: Binding(
            get: { deletingEntry != nil },
            set: { if !$0 { deletingEntry = nil } }
        )) {
            Button("Delete", role: .destructive) {
                if let entry = deletingEntry {
                    Task { await store.deleteEntry(id: entry.id) }
                }
                deletingEntry = nil
            }
            Button("Cancel", role: .cancel) { deletingEntry = nil }
        } message: {
            Text("This removes the entry from your challenge history.")
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(challenge.name)
                .font(.title2.weight(.semibold))
            Text("Log tallies fast and keep your pace honest.")
                .font(.callout)
                .foregroundStyle(.secondary)
            Button("Log entry") {
                isPresentingCreate = true
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var syncStatusCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sync status")
                .font(.headline)
            Text(syncDescription)
                .font(.callout)
                .foregroundStyle(.secondary)
            if let error = store.lastError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Color(red: 0.7, green: 0.15, blue: 0.15))
            }
            if case .queued = store.syncStatus {
                Button("Sync queued writes") {
                    Task { await store.syncQueuedWrites() }
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
        )
    }

    private var heatmapCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Daily tallies")
                        .font(.headline)
                    Text(selectedLabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if selectedDate != nil {
                    Button("Clear") { selectedDate = nil }
                        .font(.caption)
                }
            }
            HeatmapGrid(
                days: heatmapDays,
                selectedDate: selectedDate,
                onSelect: { selectedDate = $0 }
            )
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
        )
    }

    private var entriesList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Entries")
                .font(.headline)
            if filteredEntries.isEmpty {
                Text(emptyMessage)
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(filteredEntries, id: \.id) { entry in
                    EntryRowView(entry: entry)
                        .contextMenu {
                            Button("Edit") { editingEntry = entry }
                            Button("Delete", role: .destructive) { deletingEntry = entry }
                        }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
        )
    }

    private var challengeEntries: [Entry] {
        store.entries
            .filter { $0.challengeId == challenge.id }
            .sorted { $0.date > $1.date }
    }

    private var filteredEntries: [Entry] {
        if let selectedDate {
            return challengeEntries.filter { $0.date == selectedDate }
        }
        return Array(challengeEntries.prefix(12))
    }

    private var emptyMessage: String {
        if selectedDate != nil {
            return "No entries logged on this day."
        }
        return "No entries yet. Log your first tally to see it here."
    }

    private var selectedLabel: String {
        guard let selectedDate else { return "Tap a day to drill in." }
        let count = totalsByDate[selectedDate] ?? 0
        return "\(selectedDate) · \(count) tallies"
    }

    private var totalsByDate: [String: Int] {
        challengeEntries.reduce(into: [:]) { result, entry in
            result[entry.date, default: 0] += entry.count
        }
    }

    private var heatmapDays: [HeatmapDay] {
        let calendar = Calendar(identifier: .gregorian)
        let today = calendar.startOfDay(for: Date())
        return (0..<28).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: -offset, to: today) else { return nil }
            let iso = isoDate(date)
            return HeatmapDay(date: iso, count: totalsByDate[iso] ?? 0)
        }.reversed()
    }

    private var syncDescription: String {
        switch store.syncStatus {
        case .offline:
            return "Offline. Viewing cached entries."
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
}

private func isoDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    return formatter.string(from: date)
}

private struct HeatmapDay: Identifiable, Equatable {
    let id: String
    let date: String
    let count: Int

    init(date: String, count: Int) {
        self.id = date
        self.date = date
        self.count = count
    }
}

private struct HeatmapGrid: View {
    let days: [HeatmapDay]
    let selectedDate: String?
    let onSelect: (String) -> Void

    var body: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
        LazyVGrid(columns: columns, spacing: 4) {
            ForEach(days) { day in
                Button {
                    onSelect(day.date)
                } label: {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(color(for: day.count))
                        .frame(height: 16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 4, style: .continuous)
                                .stroke(day.date == selectedDate ? Color(red: 0.68, green: 0.12, blue: 0.14) : Color(.systemGray5), lineWidth: 0.8)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel("\(day.date) \(day.count) tallies")
            }
        }
    }

    private func color(for count: Int) -> Color {
        switch count {
        case 0:
            return Color(.systemGray6)
        case 1:
            return Color(red: 0.85, green: 0.76, blue: 0.76)
        case 2:
            return Color(red: 0.78, green: 0.52, blue: 0.53)
        case 3:
            return Color(red: 0.72, green: 0.35, blue: 0.36)
        default:
            return Color(red: 0.68, green: 0.12, blue: 0.14)
        }
    }
}

private struct EntryRowView: View {
    let entry: Entry

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.date)
                    .font(.callout.weight(.medium))
                if let note = entry.note, !note.isEmpty {
                    Text(note)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Text("+\(entry.count)")
                .font(.callout.weight(.semibold))
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.systemGray6))
        )
    }
}
