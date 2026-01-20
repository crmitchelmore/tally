import SwiftUI
import TallyDesign
import TallyFeatureAuth

/// Community view - social features placeholder
struct CommunityView: View {
    var body: some View {
        VStack(spacing: TallySpacing.lg) {
            Spacer()
            
            // Placeholder icon
            TallyMarkView(count: 25, size: 80)
                .opacity(0.3)
            
            Text("Community")
                .font(.tallyTitleLarge)
                .foregroundColor(Color.tallyInk)
            
            Text("Connect with friends and share your progress")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .multilineTextAlignment(.center)
                .tallyPadding(.horizontal, TallySpacing.xl)
            
            Spacer()
        }
        .navigationTitle("Community")
    }
}

#Preview {
    NavigationStack {
        CommunityView()
    }
}
