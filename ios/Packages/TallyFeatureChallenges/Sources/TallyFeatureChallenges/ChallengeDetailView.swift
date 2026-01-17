import SwiftUI
import TallyFeatureAPIClient

struct ChallengeDetailView: View {
    let challenge: Challenge
    let entries: [Entry]
    let stats: ChallengeStats
    let onEdit: @Sendable (ChallengeDraft) async -> Void
    let onArchive: @Sendable () async -> Void
    let onDelete: @Sendable () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var isPresentingEdit = false
    @State private var isPresentingArchive = false
    @State private var isPresentingDelete = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                statsGrid
                heatmap
                entriesList
            }
            .padding(20)
        }
        .navigationTitle(challenge.name)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") { isPresentingEdit = true }
            }
            ToolbarItem(placement: .bottomBar) {
                Button("Archive") { isPresentingArchive = true }
            }
            ToolbarItem(placement: .bottomBar) {
                Button(role: .destructive) { isPresentingDelete = true } label: {
                    Text("Delete")
                }
            }
        }
        .sheet(isPresented: $isPresentingEdit) {
            ChallengeFormView(mode: .edit(challenge)) { draft in
                await onEdit(draft)
                await dismiss()
            }
        }
        .alert("Archive challenge?", isPresented: $isPresentingArchive) {
            Button("Archive", role: .destructive) {
                Task {
                    await onArchive()
                    await dismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Archived challenges stay available in your history.")
        }
        .alert("Delete challenge?", isPresented: $isPresentingDelete) {
            Button("Delete", role: .destructive) {
                Task {
                    await onDelete()
                    await dismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This removes the challenge and entries from your history.")
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(stats.total) of \(challenge.targetNumber) tallies")
                .font(.title2.weight(.semibold))
            Text("\(stats.daysLeft) days left · \(String(format: "%.1f", stats.requiredPerDay))/day needed")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var statsGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 2), spacing: 12) {
            StatTile(label: "Current streak", value: "\(stats.currentStreak) days")
            StatTile(label: "Longest streak", value: "\(stats.longestStreak) days")
            StatTile(label: "Days active", value: "\(stats.daysActive)")
            StatTile(label: "Pace", value: String(format: "%.1f/day", stats.pacePerDay))
        }
    }

    private var heatmap: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activity")
                .font(.headline)
            HeatmapGrid(days: buildHeatmap())
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var entriesList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent entries")
                .font(.headline)
            if entries.isEmpty {
                Text("No entries logged yet. Add them on the web or when offline.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(entries.prefix(6), id: \.id) { entry in
                    HStack {
                        Text(entry.date)
                            .font(.callout.weight(.medium))
                        Spacer()
                        Text("+\(entry.count)")
                            .font(.callout)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private func buildHeatmap() -> [HeatmapDay] {
        let totals = entries.reduce(into: [String: Int]()) { result, entry in
            result[entry.date, default: 0] += entry.count
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        let calendar = Calendar(identifier: .gregorian)
        let today = Date()
        return (0..<28).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: -offset, to: today) else { return nil }
            let iso = formatter.string(from: date)
            return HeatmapDay(date: iso, count: totals[iso] ?? 0)
        }.reversed()
    }
}

private struct StatTile: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.systemBackground))
        )
    }
}
