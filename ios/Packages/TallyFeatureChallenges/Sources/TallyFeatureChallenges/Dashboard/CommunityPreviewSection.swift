import SwiftUI
import TallyDesign

public struct CommunityPreviewSection: View {
    public init() {}
    
    public var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            HStack {
                Text("Community")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                Spacer()
                Text("Browse public challenges")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            VStack(spacing: TallySpacing.sm) {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 24))
                    .foregroundColor(Color.tallyInkTertiary)
                Text("Discover public challenges")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
                Text("Follow challenges from other users and track their progress.")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .tallyPadding()
            .background(Color.tallyPaper)
            .cornerRadius(12)
        }
        .tallyPadding(.horizontal)
    }
}

#Preview {
    CommunityPreviewSection()
}
