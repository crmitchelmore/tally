import SwiftUI

struct CommunityView: View {
    @State private var searchText = ""
    @State private var publicChallenges: [Challenge] = []
    
    var body: some View {
        NavigationStack {
            List {
                if publicChallenges.isEmpty {
                    ContentUnavailableView.search(text: searchText)
                } else {
                    ForEach(publicChallenges) { challenge in
                        PublicChallengeRow(challenge: challenge)
                    }
                }
            }
            .navigationTitle("Community")
            .searchable(text: $searchText, prompt: "Search public challenges")
        }
    }
}

struct PublicChallengeRow: View {
    let challenge: Challenge
    @State private var isFollowing = false
    
    var body: some View {
        HStack {
            Text(challenge.icon)
                .font(.title2)
            
            VStack(alignment: .leading) {
                Text(challenge.name)
                    .font(.headline)
                Text("\(challenge.targetNumber) in \(challenge.year)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: { isFollowing.toggle() }) {
                Image(systemName: isFollowing ? "person.badge.minus" : "person.badge.plus")
                    .foregroundColor(isFollowing ? .secondary : .accentColor)
            }
        }
    }
}

#Preview {
    CommunityView()
}
