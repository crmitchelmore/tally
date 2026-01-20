import SwiftUI
import TallyDesign

/// Sync status indicator
struct SyncStatusView: View {
    @State private var syncStatus: SyncStatus = .synced
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    enum SyncStatus {
        case offline
        case queued(count: Int)
        case syncing
        case synced
        case error
        
        var label: String {
            switch self {
            case .offline: return "Offline"
            case .queued(let count): return "\(count) queued"
            case .syncing: return "Syncing..."
            case .synced: return "Up to date"
            case .error: return "Sync issue"
            }
        }
        
        var icon: String {
            switch self {
            case .offline: return "wifi.slash"
            case .queued: return "arrow.up.circle"
            case .syncing: return "arrow.triangle.2.circlepath"
            case .synced: return "checkmark.circle"
            case .error: return "exclamationmark.triangle"
            }
        }
        
        var color: Color {
            switch self {
            case .offline: return .tallyInkTertiary
            case .queued: return .tallyWarning
            case .syncing: return .tallyInkSecondary
            case .synced: return .tallySuccess
            case .error: return .tallyError
            }
        }
    }
    
    var body: some View {
        HStack(spacing: TallySpacing.sm) {
            Image(systemName: syncStatus.icon)
                .font(.system(size: 12))
            
            Text(syncStatus.label)
                .font(.tallyLabelSmall)
        }
        .foregroundColor(syncStatus.color)
        .tallyPadding(.horizontal, TallySpacing.md)
        .tallyPadding(.vertical, TallySpacing.xs)
        .background(
            Capsule()
                .fill(syncStatus.color.opacity(0.1))
        )
        .tallyPadding(.top, TallySpacing.sm)
    }
}

#Preview("Synced") {
    SyncStatusView()
}

#Preview("Offline") {
    SyncStatusView()
        .onAppear {
            // Preview helper - would normally be injected
        }
}
