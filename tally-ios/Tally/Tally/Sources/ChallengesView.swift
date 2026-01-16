import SwiftUI

struct ChallengesView: View {
    @State private var challenges: [Challenge] = []
    @State private var showCreateSheet = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                if challenges.isEmpty {
                    ContentUnavailableView(
                        "No Challenges Yet",
                        systemImage: "plus.circle",
                        description: Text("Create your first challenge to start tracking.")
                    )
                } else {
                    LazyVStack(spacing: 16) {
                        ForEach(challenges) { challenge in
                            ChallengeCard(challenge: challenge)
                        }
                    }
                    .padding()
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
                CreateChallengeView(onSave: { challenge in
                    challenges.append(challenge)
                    showCreateSheet = false
                })
            }
        }
    }
}

struct ChallengeCard: View {
    let challenge: Challenge
    
    var progress: Double {
        Double(challenge.currentCount) / Double(challenge.targetNumber)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(challenge.icon)
                    .font(.title)
                
                VStack(alignment: .leading) {
                    Text(challenge.name)
                        .font(.headline)
                    
                    Text(challenge.paceStatus.rawValue)
                        .font(.caption)
                        .foregroundColor(challenge.paceStatus.color)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.accentColor)
                }
            }
            
            ProgressView(value: progress)
                .tint(Color(hex: challenge.color))
            
            HStack {
                Text("\(challenge.currentCount) / \(challenge.targetNumber)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(challenge.daysLeft) days left")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    ChallengesView()
}
