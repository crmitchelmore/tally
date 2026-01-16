import SwiftUI

struct CommunityView: View {
    @State private var store = CommunityStore()
    @State private var searchText = ""
    
    var filteredChallenges: [ChallengeResponse] {
        if searchText.isEmpty {
            return store.publicChallenges
        }
        return store.publicChallenges.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    var body: some View {
        NavigationStack {
            Group {
                if store.isLoading && store.publicChallenges.isEmpty {
                    ProgressView("Loading community...")
                } else if let error = store.error {
                    ContentUnavailableView(
                        "Error",
                        systemImage: "exclamationmark.triangle",
                        description: Text(error)
                    )
                } else if store.publicChallenges.isEmpty {
                    ContentUnavailableView(
                        "No Public Challenges",
                        systemImage: "person.2",
                        description: Text("Be the first to create a public challenge!")
                    )
                } else {
                    List(filteredChallenges) { challenge in
                        PublicChallengeRow(challenge: challenge)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Community")
            .searchable(text: $searchText, prompt: "Search challenges")
            .refreshable {
                await store.loadPublicChallenges()
            }
            .task {
                await store.loadPublicChallenges()
            }
        }
    }
}

struct PublicChallengeRow: View {
    let challenge: ChallengeResponse
    
    var body: some View {
        HStack(spacing: 12) {
            Text(challenge.icon)
                .font(.title2)
                .frame(width: 44, height: 44)
                .background(Color(hex: challenge.color).opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(challenge.name)
                    .font(.headline)
                
                Text(challenge.timeframeUnit == "year"
                     ? "\(challenge.targetNumber) in \(challenge.year)"
                     : "\(challenge.targetNumber) per month")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: {
                // TODO: Implement follow functionality
            }) {
                Image(systemName: "plus.circle")
                    .font(.title3)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    CommunityView()
}
