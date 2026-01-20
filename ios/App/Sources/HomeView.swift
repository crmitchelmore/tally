import SwiftUI
import TallyDesign
import TallyFeatureAuth

/// Home view - main counting interface
struct HomeView: View {
    @State private var currentCount = 0
    @State private var showingAddSheet = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: TallySpacing.xl) {
                // Hero count visualization
                VStack(spacing: TallySpacing.md) {
                    Text("Today")
                        .font(.tallyTitleMedium)
                        .foregroundColor(Color.tallyInkSecondary)
                    
                    TallyMarkView(count: currentCount, animated: true, size: 120)
                    
                    Text("\(currentCount)")
                        .font(.tallyMonoDisplay)
                        .foregroundColor(Color.tallyInk)
                }
                .tallyPadding(.top, TallySpacing.xl)
                
                // Quick add button
                Button {
                    withAnimation(TallyMotion.ease) {
                        currentCount += 1
                    }
                } label: {
                    HStack {
                        Image(systemName: "plus")
                        Text("Add One")
                            .font(.tallyTitleSmall)
                    }
                    .frame(maxWidth: .infinity)
                    .tallyPadding()
                    .background(Color.tallyAccent)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .tallyPadding(.horizontal)
                
                // Demo section showing various counts
                VStack(alignment: .leading, spacing: TallySpacing.md) {
                    Text("Examples")
                        .font(.tallyTitleMedium)
                        .foregroundColor(Color.tallyInk)
                    
                    ForEach([5, 10, 25, 50], id: \.self) { count in
                        HStack {
                            TallyMarkView(count: count, size: 40)
                            Text("\(count)")
                                .font(.tallyMonoBody)
                                .foregroundColor(Color.tallyInkSecondary)
                            Spacer()
                        }
                        .tallyPadding()
                        .background(Color.tallyPaperTint)
                        .cornerRadius(8)
                    }
                }
                .tallyPadding(.horizontal)
            }
            .tallyPadding(.bottom, TallySpacing.xxl)
        }
        .navigationTitle("Tally")
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
