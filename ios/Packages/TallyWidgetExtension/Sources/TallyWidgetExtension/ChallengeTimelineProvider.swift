import WidgetKit
import TallyWidgetShared

/// Timeline provider for challenge widgets
/// Loads cached data from App Group shared container
struct ChallengeTimelineProvider: TimelineProvider {
    
    private let dataStore = WidgetDataStore.shared
    
    // MARK: - TimelineProvider
    
    func placeholder(in context: Context) -> ChallengeEntry {
        ChallengeEntry.placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (ChallengeEntry) -> Void) {
        // For widget gallery preview, show placeholder
        if context.isPreview {
            completion(ChallengeEntry.placeholder)
            return
        }
        
        // For actual widget, load real data
        let challenges = loadChallenges(for: context.family)
        completion(ChallengeEntry(date: Date(), challenges: challenges))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<ChallengeEntry>) -> Void) {
        let challenges = loadChallenges(for: context.family)
        let entry = ChallengeEntry(date: Date(), challenges: challenges)
        
        // Update timeline every 15 minutes
        // Widget will also be refreshed when app updates data
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    // MARK: - Private
    
    /// Load appropriate number of challenges based on widget family
    private func loadChallenges(for family: WidgetFamily) -> [WidgetChallenge] {
        switch family {
        case .systemSmall, .accessoryCircular, .accessoryInline:
            // Single challenge for small widgets
            if let featured = dataStore.getFeaturedChallenge() {
                return [featured]
            }
            return []
            
        case .systemMedium, .accessoryRectangular:
            // Up to 3 challenges for medium widgets
            return dataStore.getTopChallenges(limit: 3)
            
        case .systemLarge, .systemExtraLarge:
            // All non-complete challenges for large widgets
            return dataStore.loadChallenges()
                .filter { !$0.isComplete }
                .sorted { $0.lastUpdated > $1.lastUpdated }
            
        @unknown default:
            return dataStore.getTopChallenges(limit: 3)
        }
    }
}
