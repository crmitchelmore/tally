import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Detail view for a challenge showing stats, heatmap, and actions
public struct ChallengeDetailView: View {
    let challenge: Challenge
    @Bindable var manager: ChallengesManager
    let onAddEntry: () -> Void
    let onEdit: () -> Void
    let onDismiss: () -> Void
    
    @State private var stats: ChallengeStats?
    @State private var entries: [Entry] = []
    @State private var isLoadingStats = false
    @State private var showDeleteConfirmation = false
    @State private var showArchiveConfirmation = false
    @State private var showEditEntry: Entry?
    @State private var deletedEntry: Entry?
    @State private var showUndoBanner = false
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    public init(
        challenge: Challenge,
        manager: ChallengesManager,
        onAddEntry: @escaping () -> Void,
        onEdit: @escaping () -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.challenge = challenge
        self.manager = manager
        self.onAddEntry = onAddEntry
        self.onEdit = onEdit
        self.onDismiss = onDismiss
    }
    
    public var body: some View {
        ScrollView {
            VStack(spacing: TallySpacing.lg) {
                // At-a-glance header
                headerSection
                
                // Progress section with tally marks
                progressSection
                
                // Stats grid
                if let stats = stats {
                    statsGrid(stats)
                }
                
                // Recent entries
                if !entries.isEmpty {
                    entriesSection
                }
                
                // Actions section
                actionsSection
            }
            .tallyPadding()
        }
        .background(Color.tallyPaper)
        .navigationTitle(challenge.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button("Edit", systemImage: "pencil") {
                        onEdit()
                    }
                    
                    Divider()
                    
                    if challenge.isArchived {
                        Button("Unarchive", systemImage: "tray.and.arrow.up") {
                            Task { await manager.unarchiveChallenge(id: challenge.id) }
                        }
                    } else {
                        Button("Archive", systemImage: "archivebox") {
                            showArchiveConfirmation = true
                        }
                    }
                    
                    Button("Delete", systemImage: "trash", role: .destructive) {
                        showDeleteConfirmation = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .task {
            await loadData()
        }
        .confirmationDialog(
            "Archive Challenge",
            isPresented: $showArchiveConfirmation,
            titleVisibility: .visible
        ) {
            Button("Archive") {
                Task {
                    await manager.archiveChallenge(id: challenge.id)
                    onDismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Archived challenges can be restored later.")
        }
        .confirmationDialog(
            "Delete Challenge",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                Task {
                    await manager.deleteChallenge(id: challenge.id)
                    onDismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will permanently delete the challenge and all its entries.")
        }
        .sheet(item: $showEditEntry) { entry in
            EditEntrySheet(
                entry: entry,
                challenge: challenge,
                onSave: {
                    showEditEntry = nil
                    Task { await loadData() }
                },
                onDelete: {
                    showEditEntry = nil
                    Task { await loadData() }
                },
                onCancel: {
                    showEditEntry = nil
                }
            )
        }
        .overlay(alignment: .bottom) {
            if showUndoBanner, let entry = deletedEntry {
                undoBanner(entry: entry)
                    .transition(.move(edge: .bottom))
            }
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(spacing: TallySpacing.md) {
            // Icon and timeframe
            HStack {
                Image(systemName: challenge.icon)
                    .font(.system(size: 24))
                    .foregroundColor(challengeColor)
                
                Spacer()
                
                Text(timeframeText)
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            // Public/Private badge
            if challenge.isPublic {
                HStack {
                    Image(systemName: "globe")
                        .font(.caption)
                    Text("Public")
                        .font(.tallyLabelSmall)
                }
                .foregroundColor(Color.tallyInkSecondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.tallyPaperTint)
                .cornerRadius(4)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
    
    // MARK: - Progress Section
    
    private var progressSection: some View {
        VStack(spacing: TallySpacing.lg) {
            // Main tally visualization
            TallyMarkView(
                count: stats?.totalCount ?? 0,
                animated: !reduceMotion,
                size: 120
            )
            
            // Total / Target
            HStack(alignment: .firstTextBaseline, spacing: TallySpacing.xs) {
                Text("\(stats?.totalCount ?? 0)")
                    .font(.tallyMonoDisplay)
                    .foregroundColor(Color.tallyInk)
                
                Text("/ \(challenge.target)")
                    .font(.tallyMonoBody)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            // Pace status
            if let stats = stats {
                PaceIndicator(status: stats.paceStatus)
            }
            
            // Add entry button
            Button {
                onAddEntry()
            } label: {
                Label("Add Entry", systemImage: "plus")
                    .font(.tallyTitleSmall)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.tallyAccent)
            .controlSize(.large)
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(16)
    }
    
    // MARK: - Stats Grid
    
    private func statsGrid(_ stats: ChallengeStats) -> some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: TallySpacing.md) {
            StatCard(label: "Remaining", value: "\(stats.remaining)")
            StatCard(label: "Days Left", value: "\(stats.daysRemaining)")
            StatCard(label: "Per Day Needed", value: String(format: "%.1f", stats.perDayRequired))
            StatCard(label: "Current Pace", value: String(format: "%.1f", stats.currentPace))
            StatCard(label: "Current Streak", value: "\(stats.streakCurrent)")
            StatCard(label: "Best Streak", value: "\(stats.streakBest)")
            StatCard(label: "Daily Average", value: String(format: "%.1f", stats.dailyAverage))
            
            if let bestDay = stats.bestDay {
                StatCard(label: "Best Day", value: "\(bestDay.count)")
            }
        }
    }
    
    // MARK: - Entries Section
    
    private var entriesSection: some View {
        VStack(spacing: TallySpacing.md) {
            HStack {
                Text("Recent Entries")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                Spacer()
            }
            
            VStack(spacing: TallySpacing.sm) {
                ForEach(entries.prefix(10)) { entry in
                    entryRow(entry)
                        .onTapGesture {
                            showEditEntry = entry
                        }
                }
            }
        }
    }
    
    private func entryRow(_ entry: Entry) -> some View {
        HStack(spacing: TallySpacing.md) {
            // Date
            VStack(alignment: .leading, spacing: 2) {
                Text(formatEntryDate(entry.date))
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
                
                if let feeling = entry.feeling {
                    Text(feelingEmoji(feeling))
                        .font(.caption)
                }
            }
            
            Spacer()
            
            // Count
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(entry.count)")
                    .font(.tallyMonoBody)
                    .foregroundColor(Color.tallyInk)
                
                if let sets = entry.sets, sets.count > 1 {
                    Text("\(sets.count) sets")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                }
            }
            
            // Note indicator
            if entry.note != nil && !(entry.note?.isEmpty ?? true) {
                Image(systemName: "note.text")
                    .font(.caption)
                    .foregroundColor(Color.tallyInkTertiary)
            }
        }
        .padding(TallySpacing.md)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                Task {
                    await deleteEntryWithUndo(entry)
                }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .contextMenu {
            Button {
                showEditEntry = entry
            } label: {
                Label("Edit", systemImage: "pencil")
            }
            
            Button(role: .destructive) {
                Task {
                    await deleteEntryWithUndo(entry)
                }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .accessibilityIdentifier("entryRow_\(entry.id)")
    }
    
    private func undoBanner(entry: Entry) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Entry deleted")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyPaper)
                
                Text("\(entry.count) \(challenge.resolvedUnitLabel) on \(formatEntryDate(entry.date))")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyPaper.opacity(0.8))
            }
            
            Spacer()
            
            Button {
                Task {
                    await restoreDeletedEntry()
                }
            } label: {
                Text("Undo")
                    .font(.tallyLabelMedium)
                    .fontWeight(.semibold)
                    .foregroundColor(Color.tallyAccent)
            }
        }
        .padding(TallySpacing.md)
        .background(Color.tallyInk)
        .cornerRadius(12)
        .padding(TallySpacing.md)
        .shadow(radius: 8)
    }
    
    // MARK: - Actions Section
    
    private var actionsSection: some View {
        VStack(spacing: TallySpacing.md) {
            // Date range info
            HStack {
                VStack(alignment: .leading) {
                    Text("Start Date")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                    Text(formatDate(challenge.startDate))
                        .font(.tallyBodyMedium)
                        .foregroundColor(Color.tallyInk)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("End Date")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                    Text(formatDate(challenge.endDate))
                        .font(.tallyBodyMedium)
                        .foregroundColor(Color.tallyInk)
                }
            }
            .tallyPadding()
            .background(Color.tallyPaperTint)
            .cornerRadius(12)
        }
    }
    
    // MARK: - Helpers
    
    private var challengeColor: Color {
        Color(hex: challenge.color) ?? Color.tallyAccent
    }
    
    private var timeframeText: String {
        switch challenge.timeframeType {
        case .year: return "Year Challenge"
        case .month: return "Month Challenge"
        case .custom: return "Custom Timeframe"
        }
    }
    
    private func formatDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        
        guard let date = formatter.date(from: isoString) else {
            return isoString
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateStyle = .medium
        return displayFormatter.string(from: date)
    }
    
    private func formatEntryDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        
        guard let date = formatter.date(from: isoString) else {
            return isoString
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "MMM d"
        return displayFormatter.string(from: date)
    }
    
    private func feelingEmoji(_ feeling: Feeling) -> String {
        switch feeling {
        case .great: return "🔥"
        case .good: return "😊"
        case .okay: return "😐"
        case .tough: return "😤"
        }
    }
    
    private func loadData() async {
        isLoadingStats = true
        
        async let statsTask: ChallengeStats? = {
            do {
                return try await APIClient.shared.getChallengeStats(challengeId: challenge.id)
            } catch {
                return nil
            }
        }()
        
        async let entriesTask = manager.getEntries(for: challenge.id)
        
        let (fetchedStats, fetchedEntries) = await (statsTask, entriesTask)
        
        stats = fetchedStats
        entries = fetchedEntries.sorted { $0.date > $1.date }
        isLoadingStats = false
    }
    
    private func deleteEntryWithUndo(_ entry: Entry) async {
        do {
            let deleted = try await manager.deleteEntry(id: entry.id)
            deletedEntry = deleted
            
            // Remove from local list
            entries.removeAll { $0.id == entry.id }
            
            // Show undo banner
            withAnimation {
                showUndoBanner = true
            }
            
            // Auto-dismiss after 5 seconds
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            
            withAnimation {
                showUndoBanner = false
            }
            
            // Clear deleted entry after animation
            try? await Task.sleep(nanoseconds: 300_000_000)
            deletedEntry = nil
            
        } catch {
            print("[ChallengeDetailView] Error deleting entry: \(error)")
        }
    }
    
    private func restoreDeletedEntry() async {
        guard let entry = deletedEntry else { return }
        
        withAnimation {
            showUndoBanner = false
        }
        
        do {
            try await manager.restoreEntry(id: entry.id)
            await loadData()
        } catch {
            print("[ChallengeDetailView] Error restoring entry: \(error)")
        }
        
        deletedEntry = nil
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(spacing: TallySpacing.xs) {
            Text(value)
                .font(.tallyMonoBody)
                .foregroundColor(Color.tallyInk)
            
            Text(label)
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .frame(maxWidth: .infinity)
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(8)
    }
}

#Preview {
    NavigationStack {
        ChallengeDetailView(
            challenge: Challenge(
                id: "1",
                userId: "user1",
                name: "Read 100 Books",
                target: 100,
                timeframeType: .year,
                startDate: "2026-01-01",
                endDate: "2026-12-31",
                color: "#D94343",
                icon: "book.fill",
                isPublic: true,
                isArchived: false,
                createdAt: "2026-01-01T00:00:00Z",
                updatedAt: "2026-01-01T00:00:00Z"
            ),
            manager: ChallengesManager(),
            onAddEntry: {},
            onEdit: {},
            onDismiss: {}
        )
    }
}
