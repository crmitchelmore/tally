import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Detail view for a challenge showing stats, burn-up chart, and actions
public struct ChallengeDetailView: View {
    @State private var challenge: Challenge
    @Bindable var manager: ChallengesManager
    let onAddEntry: () -> Void
    let onEdit: () -> Void
    let onDismiss: () -> Void
    let onDeleteChallenge: ((Challenge) -> Void)?
    
    @State private var stats: ChallengeStats?
    @State private var entries: [Entry] = []
    @State private var isLoadingStats = false
    @State private var showDeleteConfirmation = false
    @State private var showArchiveConfirmation = false
    @State private var selectedEntry: Entry?
    @State private var showAddEntrySheet = false
    @State private var drilldownDate: String?
    @State private var deletedEntry: Entry?
    @State private var showMoreEntries = false
    @State private var sortField: SortField = .date
    @State private var sortDirection: SortDirection = .desc
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    public init(
        challenge: Challenge,
        manager: ChallengesManager,
        onAddEntry: @escaping () -> Void,
        onEdit: @escaping () -> Void,
        onDismiss: @escaping () -> Void,
        onDeleteChallenge: ((Challenge) -> Void)? = nil
    ) {
        _challenge = State(initialValue: challenge)
        self.manager = manager
        self.onAddEntry = onAddEntry
        self.onEdit = onEdit
        self.onDismiss = onDismiss
        self.onDeleteChallenge = onDeleteChallenge
    }
    
    public var body: some View {
        ScrollView {
            VStack(spacing: TallySpacing.lg) {
                // At-a-glance header
                headerSection
                
                // Progress section with tally marks
                progressSection
                
                // Future challenge banner (shows "Starts in X days")
                if challenge.isFuture, let startsText = challenge.startsInText {
                    futureChallengeCallout(startsText: startsText)
                }
                
                if let stats = stats, challenge.hasStarted {
                    paceCallout(stats)
                    streaksAndRecordsSection(stats)
                }
                
                // Stats grid
                if let stats = stats, challenge.hasStarted {
                    statsGrid(stats)
                    
                    // Burn-up chart showing full duration with projection
                    BurnUpChartView(
                        challenge: challenge,
                        stats: stats,
                        entries: entries
                    )
                }
                
                if let stats = stats, challenge.hasStarted {
                    ActivityHeatmapView(
                        entries: entries,
                        startDate: challenge.startDate,
                        endDate: challenge.endDate,
                        colorHex: challenge.color,
                        onDayTap: { date in
                            drilldownDate = date
                        }
                    )
                    .accessibilityIdentifier("activity-heatmap")
                }
                
                entriesHistorySection
                
                // Actions section
                actionsSection
            }
            .tallyPadding()
        }
        .background(Color.tallyPaper)
        .navigationTitle(challenge.name)
        .navigationBarTitleDisplayMode(.large)
        .accessibilityIdentifier("challenge-title")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showAddEntrySheet = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("Add entry")
            }
            
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
                .accessibilityIdentifier("challenge-actions-menu")
            }
        }
        .task {
            await loadStats()
        }
        .onChange(of: manager.challenges) { _, _ in
            guard let updated = manager.challenge(id: challenge.id), updated != challenge else { return }
            challenge = updated
        }
        .onChange(of: manager.stats) { _, _ in
            if let updatedStats = manager.stats(for: challenge.id), updatedStats != stats {
                stats = updatedStats
            }
        }
        .sheet(isPresented: $showAddEntrySheet) {
            AddEntrySheet(
                challenge: challenge,
                recentEntries: entries,
                onSubmit: { request in
                    manager.addEntry(request)
                    entries = manager.entries(for: challenge.id)
                    stats = manager.stats(for: challenge.id)
                },
                onDismiss: {
                    showAddEntrySheet = false
                    entries = manager.entries(for: challenge.id)
                    stats = manager.stats(for: challenge.id)
                }
            )
        }
        .sheet(item: $selectedEntry) { entry in
            EditEntrySheet(
                entry: entry,
                challenge: challenge,
                manager: manager,
                onSave: {
                    selectedEntry = nil
                    entries = manager.entries(for: challenge.id)
                },
                onDelete: {
                    deletedEntry = entry
                    manager.deleteEntry(entry)
                    entries = manager.entries(for: challenge.id)
                    selectedEntry = nil
                },
                onCancel: {
                    selectedEntry = nil
                }
            )
        }
        .sheet(isPresented: Binding(
            get: { drilldownDate != nil },
            set: { if !$0 { drilldownDate = nil } }
        )) {
            if let date = drilldownDate {
                DayDrilldownSheet(
                    date: date,
                    entries: entries.filter { $0.date == date },
                    unitLabel: challenge.resolvedUnitLabel,
                    challengeColor: challenge.color,
                    onEdit: { entry in
                        selectedEntry = entry
                    },
                    onDelete: { entry in
                        deletedEntry = entry
                        manager.deleteEntry(entry)
                        entries = manager.entries(for: challenge.id)
                    },
                    onAddEntry: {
                        drilldownDate = nil
                        showAddEntrySheet = true
                    }
                )
            }
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
                    onDeleteChallenge?(challenge)
                    onDismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You can undo this for a short time after deleting.")
        }
        .overlay(alignment: .bottom) {
            if let deletedEntry {
                UndoToastView(
                    message: "Entry deleted",
                    onUndo: {
                        Task {
                            _ = try? await APIClient.shared.restoreEntry(id: deletedEntry.id)
                            await loadStats()
                            await manager.fetchEntries(for: challenge.id)
                            entries = manager.entries(for: challenge.id)
                        }
                        self.deletedEntry = nil
                    },
                    onDismiss: {
                        self.deletedEntry = nil
                    }
                )
                .tallyPadding(.horizontal)
                .tallyPadding(.bottom, TallySpacing.lg)
            }
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(spacing: TallySpacing.sm) {
            // Icon and timeframe
            HStack {
                Image(systemName: IconMapper.sfSymbol(for: challenge.icon))
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
        VStack(spacing: TallySpacing.md) {
            // Main tally visualization - let it size naturally based on count
            ScrollView(.horizontal, showsIndicators: false) {
                TallyMarkView(
                    count: stats?.totalCount ?? 0,
                    animated: !reduceMotion,
                    size: 140
                )
                .fixedSize()
                .frame(maxWidth: .infinity)
            }
            .accessibilityIdentifier("progress-ring")
            .scrollBounceBehavior(.basedOnSize)
            
            // Total / Target
            HStack(alignment: .firstTextBaseline, spacing: TallySpacing.xs) {
                Text("\(stats?.totalCount ?? 0)")
                    .font(.tallyMonoDisplay)
                    .foregroundColor(Color.tallyInk)
                    .accessibilityIdentifier("challenge-total-count")
                    .accessibilityLabel("\(stats?.totalCount ?? 0)")
                
                Text("/ \(challenge.target) \(challenge.resolvedUnitLabel)")
                    .font(.tallyMonoBody)
                    .foregroundColor(Color.tallyInkSecondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }
            
            // Pace status or future badge
            if challenge.isFuture, let startsText = challenge.startsInText {
                FutureChallengeBadge(text: startsText)
                    .accessibilityIdentifier("future-badge")
            } else if let stats = stats {
                PaceIndicator(status: stats.paceStatus)
                    .accessibilityIdentifier("pace-status")
            }
            
                // Add entry button (disabled for future challenges)
                Button {
                    showAddEntrySheet = true
                } label: {
                    Label("Add Entry", systemImage: "plus")
                        .font(.tallyTitleSmall)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.tallyAccent)
                .controlSize(.large)
                .disabled(challenge.isFuture)
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(16)
    }
    
    /// Callout for future challenges that haven't started yet
    private func futureChallengeCallout(startsText: String) -> some View {
        VStack(alignment: .leading, spacing: TallySpacing.xs) {
            HStack(spacing: TallySpacing.xs) {
                Image(systemName: "calendar.badge.clock")
                    .foregroundColor(Color.tallyInkSecondary)
                Text(startsText.capitalized)
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
            }
            Text("This challenge will begin on \(formatDate(challenge.startDate)). You can add entries once it starts.")
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .tallyPadding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }

    private func paceCallout(_ stats: ChallengeStats) -> some View {
        let paceMessage = paceMessage(for: stats)
        return VStack(alignment: .leading, spacing: TallySpacing.xs) {
            Text(paceMessage.title)
                .font(.tallyLabelMedium)
                .foregroundColor(paceMessage.color)
            Text(paceMessage.subtitle)
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .tallyPadding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
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
                StatCard(label: "Best Day", value: "\(bestDay.count) \(challenge.resolvedUnitLabel)")
            }
        }
    }

    private func streaksAndRecordsSection(_ stats: ChallengeStats) -> some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            Text("Streaks & Records")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            
            VStack(spacing: TallySpacing.sm) {
                RecordRow(
                    label: "Current Streak",
                    value: "\(stats.streakCurrent) days"
                )
                
                RecordRow(
                    label: "Best Streak",
                    value: "\(stats.streakBest) days"
                )
                
                if let bestDay = stats.bestDay {
                    RecordRow(
                        label: "Best Day",
                        value: "\(bestDay.count) \(challenge.resolvedUnitLabel)",
                        subvalue: formatDate(bestDay.date)
                    )
                }
                
                RecordRow(
                    label: "Daily Average",
                    value: String(format: "%.1f", stats.dailyAverage)
                )
            }
            .padding(TallySpacing.md)
            .background(Color.tallyPaperTint)
            .cornerRadius(12)
        }
        .tallyPadding(.horizontal)
    }
    
    private var entriesHistorySection: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            Text("Entry History")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            
            if entries.isEmpty {
                Text("No entries yet")
                    .font(.tallyBodyMedium)
                    .foregroundColor(Color.tallyInkSecondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                VStack(spacing: TallySpacing.md) {
                    entrySortControls
                    ForEach(sortedEntryDates, id: \.self) { date in
                        VStack(alignment: .leading, spacing: TallySpacing.sm) {
                            HStack {
                                Text(formatDate(date))
                                    .font(.tallyLabelMedium)
                                    .foregroundColor(Color.tallyInkSecondary)
                                Spacer()
                                Text("\(totalForDate(date)) total")
                                    .font(.tallyLabelSmall)
                                    .foregroundColor(Color.tallyInkSecondary)
                            }
                            
                            VStack(spacing: TallySpacing.sm) {
                                ForEach(entriesForDate(date)) { entry in
                                    RecentEntryRow(
                                        entry: entry,
                                        challenge: challenge,
                                        onEdit: { selectedEntry = entry },
                                        onDelete: {
                                            deletedEntry = entry
                                            manager.deleteEntry(entry)
                                            entries = manager.entries(for: challenge.id)
                                        }
                                    )
                                }
                            }
                        }
                    }
                    
                    if entries.count > 20 {
                        Button(showMoreEntries ? "Show Less" : "Show More") {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                showMoreEntries.toggle()
                            }
                        }
                        .font(.tallyLabelMedium)
                        .foregroundColor(Color.tallyAccent)
                        .frame(maxWidth: .infinity)
                        .padding(.top, TallySpacing.sm)
                    }
                }
            }
        }
        .tallyPadding(.horizontal)
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

    private var visibleEntries: [Entry] {
        let sorted = entries.sorted { lhs, rhs in
            switch sortField {
            case .date:
                if lhs.date == rhs.date {
                    return sortDirection == .desc ? lhs.createdAt > rhs.createdAt : lhs.createdAt < rhs.createdAt
                }
                return sortDirection == .desc ? lhs.date > rhs.date : lhs.date < rhs.date
            case .count:
                if lhs.count == rhs.count {
                    return sortDirection == .desc ? lhs.createdAt > rhs.createdAt : lhs.createdAt < rhs.createdAt
                }
                return sortDirection == .desc ? lhs.count > rhs.count : lhs.count < rhs.count
            }
        }
        if showMoreEntries {
            return sorted
        }
        return Array(sorted.prefix(20))
    }

    private var sortedEntryDates: [String] {
        let dates = Set(visibleEntries.map { $0.date })
        return dates.sorted(by: sortDirection == .desc ? (>) : (<))
    }

    private func entriesForDate(_ date: String) -> [Entry] {
        let entries = visibleEntries.filter { $0.date == date }
        if sortField == .count {
            return entries.sorted {
                sortDirection == .desc ? $0.count > $1.count : $0.count < $1.count
            }
        }
        return entries.sorted {
            sortDirection == .desc ? $0.createdAt > $1.createdAt : $0.createdAt < $1.createdAt
        }
    }

    private func totalForDate(_ date: String) -> Int {
        entriesForDate(date).reduce(0) { $0 + $1.count }
    }

    private func paceMessage(for stats: ChallengeStats) -> (title: String, subtitle: String, color: Color) {
        let unitLabel = challenge.resolvedUnitLabel
        let behindBy = max(0, expectedByNow(for: stats) - stats.totalCount)
        let bestDayCount = stats.bestDay?.count ?? 0
        switch stats.paceStatus {
        case .ahead:
            return ("You're ahead of pace!", "Current pace: \(String(format: "%.1f", stats.currentPace))/day · Best day: \(bestDayCount) \(unitLabel)", Color.tallySuccess)
        case .onPace:
            return ("Right on track.", "Current pace: \(String(format: "%.1f", stats.currentPace))/day · Best day: \(bestDayCount) \(unitLabel)", Color.tallyInk)
        case .behind:
            return ("Behind by \(behindBy) \(unitLabel)", "Current pace: \(String(format: "%.1f", stats.currentPace))/day · Best day: \(bestDayCount) \(unitLabel)", Color.tallyWarning)
        case .none:
            return ("Set your pace", "Log an entry to see pace insights.", Color.tallyInkSecondary)
        }
    }

    private func expectedByNow(for stats: ChallengeStats) -> Int {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        guard let startDate = formatter.date(from: challenge.startDate),
              let endDate = formatter.date(from: challenge.endDate) else {
            return 0
        }
        let totalDays = max(1, Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0)
        let expected = (Double(stats.daysElapsed) / Double(totalDays)) * Double(challenge.target)
        return Int(expected.rounded(.up))
    }
    
    private var entrySortControls: some View {
        HStack(spacing: TallySpacing.sm) {
            Text("Sort by")
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
            
            sortButton(title: "Date", field: .date)
            sortButton(title: "Count", field: .count)
        }
    }
    
    private func sortButton(title: String, field: SortField) -> some View {
        Button {
            if sortField == field {
                sortDirection = sortDirection == .desc ? .asc : .desc
            } else {
                sortField = field
                sortDirection = .desc
            }
        } label: {
            HStack(spacing: 4) {
                Text(title)
                    .font(.tallyLabelSmall)
                if sortField == field {
                    Image(systemName: sortDirection == .desc ? "arrow.down" : "arrow.up")
                        .font(.system(size: 10, weight: .semibold))
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(sortField == field ? Color.tallyAccent.opacity(0.12) : Color.clear)
            .cornerRadius(6)
        }
        .buttonStyle(.plain)
        .foregroundColor(sortField == field ? Color.tallyAccent : Color.tallyInkSecondary)
    }
    
    private func loadStats() async {
        isLoadingStats = true
        
        // Load entries for the burn-up chart
        entries = manager.entries(for: challenge.id)
        await manager.fetchEntries(for: challenge.id)
        entries = manager.entries(for: challenge.id)
        
        do {
            stats = try await APIClient.shared.getChallengeStats(challengeId: challenge.id)
        } catch {
            stats = manager.stats(for: challenge.id)
        }
        isLoadingStats = false
    }
}

private struct DayDrilldownSheet: View {
    let date: String
    let entries: [Entry]
    let unitLabel: String
    let challengeColor: String
    let onEdit: (Entry) -> Void
    let onDelete: (Entry) -> Void
    let onAddEntry: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack(spacing: TallySpacing.md) {
                if entries.isEmpty {
                    Text("No entries for this day.")
                        .font(.tallyBodyMedium)
                        .foregroundColor(Color.tallyInkSecondary)
                } else {
                    VStack(spacing: TallySpacing.sm) {
                        ForEach(entries) { entry in
                            DayEntryRow(
                                entry: entry,
                                unitLabel: unitLabel,
                                colorHex: challengeColor,
                                onEdit: { onEdit(entry) },
                                onDelete: { onDelete(entry) }
                            )
                        }
                    }
                }
                Spacer()
            }
            .tallyPadding()
            .navigationTitle(formattedDate(date))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add Entry") {
                        dismiss()
                        onAddEntry()
                    }
                }
            }
        }
    }
    
    private func formattedDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        guard let date = formatter.date(from: iso) else { return iso }
        let display = DateFormatter()
        display.dateStyle = .medium
        return display.string(from: date)
    }
}

private struct DayEntryRow: View {
    let entry: Entry
    let unitLabel: String
    let colorHex: String
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack(spacing: TallySpacing.md) {
            TallyMarkView(count: entry.count, size: 32)
                .fixedSize()
            
            VStack(alignment: .leading, spacing: TallySpacing.xs) {
                Text("\(entry.count) \(unitLabel)")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
                
                if let sets = entry.sets, !sets.isEmpty {
                    Text("\(sets.count) sets: \(sets.map { String($0) }.joined(separator: " + ")) = \(entry.count)")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                }
                
                if let note = entry.note, !note.isEmpty {
                    Text(note)
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                        .lineLimit(2)
                }
            }
            
            Spacer()
            
            Button(action: onEdit) {
                Image(systemName: "pencil")
            }
            .buttonStyle(.plain)
            .foregroundColor(Color.tallyInkSecondary)
            
            Button(action: onDelete) {
                Image(systemName: "trash")
            }
            .buttonStyle(.plain)
            .foregroundColor(Color.tallyError)
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(Color(hex: colorHex) ?? Color.tallyAccent)
                .frame(width: 3)
                .cornerRadius(1.5)
                .padding(.vertical, 8)
        }
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

private struct RecentEntryRow: View {
    let entry: Entry
    let challenge: Challenge
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    static let dateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()
    
    static let dateDisplayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter
    }()
    
    static let timeFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
    
    static let timeDisplayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter
    }()
    
    var body: some View {
        HStack(spacing: TallySpacing.md) {
            TallyMarkView(count: entry.count, size: 36)
                .fixedSize()
            
            VStack(alignment: .leading, spacing: TallySpacing.xs) {
                HStack(spacing: TallySpacing.xs) {
                    Text("\(entry.count) \(challenge.resolvedUnitLabel)")
                        .font(.tallyLabelMedium)
                        .foregroundColor(Color.tallyInk)
                    
                    if let feeling = entry.feeling {
                        Text(feelingLabel(feeling))
                            .font(.tallyLabelSmall)
                            .foregroundColor(Color.tallyInkSecondary)
                    }
                }
                
                if let sets = entry.sets, !sets.isEmpty {
                    Text("\(sets.count) sets: \(sets.map { String($0) }.joined(separator: " + ")) = \(entry.count)")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                }
                
                if let note = entry.note, !note.isEmpty {
                    Text(note)
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                        .lineLimit(2)
                }
                
                Text(entryTimestamp(entry))
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkTertiary)
            }
            
            Spacer()
            
            Button(action: onEdit) {
                Image(systemName: "pencil")
            }
            .buttonStyle(.plain)
            .foregroundColor(Color.tallyInkSecondary)
            .accessibilityLabel("Edit entry")
            
            Button(action: onDelete) {
                Image(systemName: "trash")
            }
            .buttonStyle(.plain)
            .foregroundColor(Color.tallyError)
            .accessibilityLabel("Delete entry")
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
}

private func entryTimestamp(_ entry: Entry) -> String {
    let dateText: String
    if let date = RecentEntryRow.dateFormatter.date(from: entry.date) {
        dateText = RecentEntryRow.dateDisplayFormatter.string(from: date)
    } else {
        dateText = entry.date
    }
    
    if let date = RecentEntryRow.timeFormatter.date(from: entry.createdAt) {
        let time = RecentEntryRow.timeDisplayFormatter.string(from: date)
        return "\(dateText) \(time)"
    }
    return dateText
}

private func feelingLabel(_ feeling: Feeling) -> String {
    switch feeling {
    case .great: return "Great"
    case .good: return "Good"
    case .okay: return "Okay"
    case .tough: return "Tough"
    }
}

private enum SortField {
    case date
    case count
}

private enum SortDirection {
    case asc
    case desc
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
