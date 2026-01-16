import SwiftUI

struct LeaderboardView: View {
    @State private var timeRange: TimeRange = .month
    @State private var entries: [LeaderboardEntry] = []
    
    enum TimeRange: String, CaseIterable {
        case week = "Week"
        case month = "Month"
        case year = "Year"
        case all = "All Time"
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Time Range", selection: $timeRange) {
                    ForEach(TimeRange.allCases, id: \.self) { range in
                        Text(range.rawValue).tag(range)
                    }
                }
                .pickerStyle(.segmented)
                .padding()
                
                if entries.isEmpty {
                    ContentUnavailableView(
                        "No Entries Yet",
                        systemImage: "trophy",
                        description: Text("Be the first to log an entry and claim the top spot!")
                    )
                } else {
                    List {
                        ForEach(Array(entries.enumerated()), id: \.element.id) { index, entry in
                            LeaderboardRow(rank: index + 1, entry: entry)
                        }
                    }
                }
            }
            .navigationTitle("Leaderboard")
        }
    }
}

struct LeaderboardEntry: Identifiable {
    let id: String
    let name: String
    let avatarUrl: String?
    let total: Int
}

struct LeaderboardRow: View {
    let rank: Int
    let entry: LeaderboardEntry
    
    var rankIcon: some View {
        Group {
            switch rank {
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
                Text("\(rank)")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    var body: some View {
        HStack {
            rankIcon
                .frame(width: 32)
            
            Circle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 40, height: 40)
                .overlay {
                    Text(String(entry.name.first ?? "?"))
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
            
            Text(entry.name)
                .font(.headline)
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("\(entry.total)")
                    .font(.headline)
                Text("entries")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

#Preview {
    LeaderboardView()
}
