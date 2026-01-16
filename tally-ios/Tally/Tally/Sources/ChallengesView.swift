import SwiftUI

struct ChallengesView: View {
    @State private var store = ChallengesStore()
    @State private var entriesStore = EntriesStore()
    @State private var showCreateSheet = false
    
    var body: some View {
        NavigationStack {
            Group {
                if store.isLoading && store.challenges.isEmpty {
                    ProgressView("Loading challenges...")
                } else if let error = store.error {
                    ContentUnavailableView(
                        "Error",
                        systemImage: "exclamationmark.triangle",
                        description: Text(error)
                    )
                } else if store.challenges.isEmpty {
                    ContentUnavailableView(
                        "No Challenges Yet",
                        systemImage: "plus.circle",
                        description: Text("Create your first challenge to start tracking.")
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(store.challenges) { challenge in
                                ChallengeCardView(
                                    challenge: challenge,
                                    entriesStore: entriesStore
                                )
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Your Challenges")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showCreateSheet = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreateSheet) {
                CreateChallengeView { name, target, color, icon in
                    Task {
                        await store.createChallenge(
                            name: name,
                            targetNumber: target,
                            color: color,
                            icon: icon,
                            timeframeUnit: "year",
                            year: Calendar.current.component(.year, from: Date()),
                            isPublic: false
                        )
                    }
                    showCreateSheet = false
                }
            }
            .refreshable {
                await store.loadChallenges()
            }
            .task {
                await store.loadChallenges()
            }
        }
    }
}

struct ChallengeCardView: View {
    let challenge: ChallengeResponse
    @Bindable var entriesStore: EntriesStore
    @State private var showAddEntry = false
    
    var totalCount: Int {
        entriesStore.totalCount(for: challenge.id)
    }
    
    var progress: Double {
        Double(totalCount) / Double(challenge.targetNumber)
    }
    
    var daysLeft: Int {
        let calendar = Calendar.current
        let endOfYear = calendar.date(from: DateComponents(year: challenge.year, month: 12, day: 31))!
        return max(0, calendar.dateComponents([.day], from: Date(), to: endOfYear).day ?? 0)
    }
    
    var paceStatus: (text: String, color: Color) {
        let expectedProgress = Double(365 - daysLeft) / 365.0 * Double(challenge.targetNumber)
        let difference = Double(totalCount) - expectedProgress
        
        if difference > 1 {
            return ("Ahead", .green)
        } else if difference < -1 {
            return ("Behind", .orange)
        } else {
            return ("On pace", .blue)
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(challenge.icon)
                    .font(.title)
                
                VStack(alignment: .leading) {
                    Text(challenge.name)
                        .font(.headline)
                    
                    Text(paceStatus.text)
                        .font(.caption)
                        .foregroundColor(paceStatus.color)
                }
                
                Spacer()
                
                Button(action: { showAddEntry = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.accentColor)
                }
            }
            
            ProgressView(value: min(1.0, progress))
                .tint(Color(hex: challenge.color))
            
            HStack {
                Text("\(totalCount) / \(challenge.targetNumber)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(daysLeft) days left")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .sheet(isPresented: $showAddEntry) {
            AddEntryView(challengeId: challenge.id) { count, note, feeling in
                Task {
                    await entriesStore.createEntry(
                        challengeId: challenge.id,
                        date: Date(),
                        count: count,
                        note: note,
                        feeling: feeling
                    )
                }
                showAddEntry = false
            }
        }
        .task {
            await entriesStore.loadEntries(for: challenge.id)
        }
    }
}

struct AddEntryView: View {
    let challengeId: String
    let onSave: (Int, String?, String?) -> Void
    
    @State private var count = 1
    @State private var note = ""
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Count") {
                    Stepper("\(count)", value: $count, in: 1...1000)
                }
                
                Section("Note (optional)") {
                    TextField("Add a note...", text: $note)
                }
            }
            .navigationTitle("Add Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(count, note.isEmpty ? nil : note, nil)
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    ChallengesView()
}
