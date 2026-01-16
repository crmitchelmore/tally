import SwiftUI

struct LeaderboardView: View {
    @State private var store = LeaderboardStore()
    
    let timeRanges = ["week", "month", "year", "all"]
    let timeRangeLabels = ["Week", "Month", "Year", "All Time"]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Time range picker
                Picker("Time Range", selection: $store.selectedTimeRange) {
                    ForEach(Array(zip(timeRanges, timeRangeLabels)), id: \.0) { range, label in
                        Text(label).tag(range)
                    }
                }
                .pickerStyle(.segmented)
                .padding()
                .onChange(of: store.selectedTimeRange) {
                    Task { await store.loadLeaderboard() }
                }
                
                // Leaderboard list
                if store.isLoading && store.entries.isEmpty {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if let error = store.error {
                    ContentUnavailableView(
                        "Error",
                        systemImage: "exclamationmark.triangle",
                        description: Text(error)
                    )
                } else if store.entries.isEmpty {
                    ContentUnavailableView(
                        "No Entries Yet",
                        systemImage: "trophy",
                        description: Text("Be the first to log an entry!")
                    )
                } else {
                    List(store.entries) { entry in
                        LeaderboardRowView(entry: entry)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Leaderboard")
            .refreshable {
                await store.loadLeaderboard()
            }
            .task {
                await store.loadLeaderboard()
            }
        }
    }
}

struct LeaderboardRowView: View {
    let entry: LeaderboardEntry
    
    var rankIcon: some View {
        Group {
            switch entry.rank {
            case 1:
                Image(systemName: "trophy.fill")
                    .foregroundColor(.yellow)
            case 2:
                Image(systemName: "medal.fill")
                    .foregroundColor(.gray)
            case 3:
                Image(systemName: "medal.fill")
                    .foregroundColor(.orange)
            default:
                Text("\(entry.rank)")
                    .font(.headline)
                    .foregroundColor(.secondary)
                    .frame(width: 30)
            }
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            rankIcon
                .frame(width: 30)
            
            // Avatar
            if let avatarUrl = entry.avatarUrl, let url = URL(string: avatarUrl) {
                AsyncImage(url: url) { image in
                    image.resizable()
                } placeholder: {
                    Circle().fill(Color.gray.opacity(0.3))
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
            } else {
                Circle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 40, height: 40)
                    .overlay {
                        Text(String(entry.name?.prefix(1) ?? "?"))
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
            }
            
            VStack(alignment: .leading) {
                Text(entry.name ?? "Anonymous")
                    .font(.body)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("\(entry.total)")
                    .font(.headline)
                Text("entries")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    LeaderboardView()
}
