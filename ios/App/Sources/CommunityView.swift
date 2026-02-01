import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureChallenges
import TallyFeatureAPIClient

/// Community view - browse and follow public challenges
struct CommunityView: View {
    @State private var publicChallenges: [PublicChallenge] = []
    @State private var followedChallenges: [PublicChallenge] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var searchText = ""
    @State private var selectedTab = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Tabs
            Picker("View", selection: $selectedTab) {
                Text("Discover").tag(0)
                Text("Following").tag(1)
            }
            .pickerStyle(.segmented)
            .tallyPadding(.horizontal)
            .tallyPadding(.vertical, TallySpacing.sm)
            
            if let error = errorMessage {
                errorView(error)
            } else if selectedTab == 0 {
                discoverView
            } else {
                followingView
            }
        }
        .navigationTitle("Community")
        .searchable(text: $searchText, prompt: "Search challenges")
        .refreshable {
            await loadChallenges()
        }
        .task {
            await loadChallenges()
        }
    }
    
    // MARK: - Error View
    
    private func errorView(_ message: String) -> some View {
        VStack(spacing: TallySpacing.lg) {
            Spacer()
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(Color.tallyWarning)
            Text("Could not load challenges")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            Text(message)
                .font(.tallyBodySmall)
                .foregroundColor(Color.tallyInkSecondary)
            Button("Try Again") {
                Task { await loadChallenges() }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.tallyAccent)
            Spacer()
        }
    }
    
    // MARK: - Discover View
    
    private var discoverView: some View {
        ScrollView {
            LazyVStack(spacing: TallySpacing.md) {
                if filteredPublicChallenges.isEmpty {
                    emptyDiscoverView
                } else {
                    ForEach(filteredPublicChallenges, id: \.id) { challenge in
                        PublicChallengeCard(
                            challenge: challenge,
                            isFollowing: isFollowing(challenge),
                            onFollow: { await toggleFollow(challenge) }
                        )
                    }
                }
            }
            .tallyPadding()
        }
    }
    
    private var emptyDiscoverView: some View {
        VStack(spacing: TallySpacing.lg) {
            Image(systemName: "person.3.fill")
                .font(.system(size: 48))
                .foregroundColor(Color.tallyInkTertiary)
            Text("No public challenges yet")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            Text("Be the first to share a challenge!")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, TallySpacing.xxl)
    }
    
    // MARK: - Following View
    
    private var followingView: some View {
        ScrollView {
            LazyVStack(spacing: TallySpacing.md) {
                if followedChallenges.isEmpty {
                    emptyFollowingView
                } else {
                    ForEach(followedChallenges, id: \.id) { challenge in
                        PublicChallengeCard(
                            challenge: challenge,
                            isFollowing: true,
                            onFollow: { await toggleFollow(challenge) }
                        )
                    }
                }
            }
            .tallyPadding()
        }
    }
    
    private var emptyFollowingView: some View {
        VStack(spacing: TallySpacing.lg) {
            Image(systemName: "heart")
                .font(.system(size: 48))
                .foregroundColor(Color.tallyInkTertiary)
            Text("Not following anyone yet")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            Text("Discover public challenges and follow them to cheer others on!")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, TallySpacing.xxl)
    }
    
    // MARK: - Helpers
    
    private var filteredPublicChallenges: [PublicChallenge] {
        if searchText.isEmpty {
            return publicChallenges
        }
        return publicChallenges.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.owner.name.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    private func isFollowing(_ challenge: PublicChallenge) -> Bool {
        followedChallenges.contains { $0.id == challenge.id }
    }
    
    private func loadChallenges() async {
        isLoading = true
        errorMessage = nil
        
        do {
            async let publicResult = APIClient.shared.listPublicChallenges()
            async let followedResult = APIClient.shared.listFollowedChallenges()
            
            let (pub, followed) = try await (publicResult, followedResult)
            publicChallenges = pub
            followedChallenges = followed
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func toggleFollow(_ challenge: PublicChallenge) async {
        do {
            if isFollowing(challenge) {
                try await APIClient.shared.unfollowChallenge(id: challenge.id)
                followedChallenges.removeAll { $0.id == challenge.id }
            } else {
                try await APIClient.shared.followChallenge(id: challenge.id)
                followedChallenges.append(challenge)
            }
        } catch {
            // Show error toast
        }
    }
}

// MARK: - Public Challenge Card

struct PublicChallengeCard: View {
    let challenge: PublicChallenge
    let isFollowing: Bool
    let onFollow: () async -> Void
    
    @State private var isFollowLoading = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            // Header: icon, name, owner
            HStack {
                // Challenge icon
                Image(systemName: IconMapper.sfSymbol(for: challenge.icon))
                    .font(.title2)
                    .foregroundColor(Color(hex: challenge.color) ?? Color.tallyAccent)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(challenge.name)
                        .font(.tallyTitleSmall)
                        .foregroundColor(Color.tallyInk)
                    
                    let ownerName = challenge.owner.name
                    if !ownerName.isEmpty {
                        Text("by \(ownerName)")
                            .font(.tallyLabelSmall)
                            .foregroundColor(Color.tallyInkSecondary)
                    }
                }
                
                Spacer()
                
                // Follow button
                Button {
                    Task {
                        isFollowLoading = true
                        await onFollow()
                        isFollowLoading = false
                    }
                } label: {
                    if isFollowLoading {
                        ProgressView()
                            .frame(width: 60)
                    } else {
                        Text(isFollowing ? "Following" : "Follow")
                            .font(.tallyLabelMedium)
                            .fontWeight(.medium)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(isFollowing ? Color.tallyInkTertiary : Color.tallyAccent)
                .disabled(isFollowLoading)
            }
            
            // Progress
            HStack(alignment: .bottom, spacing: TallySpacing.md) {
                TallyMarkView(count: challenge.totalReps, size: 40)
                
                VStack(alignment: .leading, spacing: TallySpacing.xs) {
                    HStack {
                        Text("\(challenge.totalReps)")
                            .font(.tallyMonoBody)
                            .foregroundColor(Color.tallyInk)
                        Text("/ \(challenge.target)")
                            .font(.tallyLabelMedium)
                            .foregroundColor(Color.tallyInkSecondary)
                    }
                    
                    // Progress bar
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.tallyPaperTint)
                                .frame(height: 4)
                                .cornerRadius(2)
                            
                            Rectangle()
                                .fill(Color(hex: challenge.color) ?? Color.tallyAccent)
                                .frame(width: progressWidth(for: geo.size.width), height: 4)
                                .cornerRadius(2)
                        }
                    }
                    .frame(height: 4)
                }
                
                Spacer()
            }
            
            // Footer: followers count
            HStack {
                Image(systemName: "person.2.fill")
                    .font(.caption)
                    .foregroundColor(Color.tallyInkSecondary)
                Text("\(challenge.followerCount) followers")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
            }
        }
        .tallyPadding()
        .background(Color.tallyPaper)
        .cornerRadius(12)
        .shadow(color: Color.tallyInk.opacity(0.06), radius: 4, x: 0, y: 2)
    }
    
    private var progress: Double {
        guard challenge.target > 0 else { return 0 }
        return min(1.0, Double(challenge.totalReps) / Double(challenge.target))
    }
    
    private func progressWidth(for totalWidth: CGFloat) -> CGFloat {
        max(0, min(totalWidth, totalWidth * progress))
    }
}

#Preview {
    NavigationStack {
        CommunityView()
    }
}
