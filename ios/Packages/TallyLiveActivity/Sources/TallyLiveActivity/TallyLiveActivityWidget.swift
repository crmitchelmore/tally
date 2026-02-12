import SwiftUI
import WidgetKit
import ActivityKit
import TallyDesign

/// Live Activity widget configuration for tracking sessions
@available(iOS 17.0, *)
public struct TallyLiveActivityWidget: Widget {
    public init() {}
    
    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: TallyActivityAttributes.self) { context in
            // Lock Screen / Banner presentation
            LockScreenLiveActivityView(context: context)
                .activityBackgroundTint(Color.tallyPaper)
                .activitySystemActionForegroundColor(.tallyInk)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded regions
                DynamicIslandExpandedRegion(.leading) {
                    ExpandedLeadingView(context: context)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ExpandedTrailingView(context: context)
                }
                DynamicIslandExpandedRegion(.center) {
                    ExpandedCenterView(context: context)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ExpandedBottomView(context: context)
                }
            } compactLeading: {
                CompactLeadingView(context: context)
            } compactTrailing: {
                CompactTrailingView(context: context)
            } minimal: {
                MinimalView(context: context)
            }
            .keylineTint(.tallyAccent)
        }
    }
}

// MARK: - Lock Screen View

@available(iOS 17.0, *)
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        HStack(spacing: TallySpacing.md) {
            // Tally marks visualization
            VStack(alignment: .leading, spacing: TallySpacing.xs) {
                Text(context.attributes.challengeName)
                    .font(.tallyLabelMedium)
                    .foregroundStyle(.primary)
                
                TallyMarkView(count: context.state.sessionCount, size: 40)
            }
            
            Spacer()
            
            // Session stats
            VStack(alignment: .trailing, spacing: TallySpacing.xs) {
                // Session count
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text("+\(context.state.sessionCount)")
                        .font(.tallyDisplaySmall)
                        .foregroundStyle(Color.tallyAccent)
                }
                
                // Total progress
                Text("\(context.state.totalCount) / \(context.state.target)")
                    .font(.tallyLabelSmall)
                    .foregroundStyle(.secondary)
                
                // Progress bar
                ProgressView(value: context.state.progress)
                    .tint(Color.tallyAccent)
                    .frame(width: 80)
            }
        }
        .padding(TallySpacing.md)
    }
}

// MARK: - Dynamic Island Views

@available(iOS 17.0, *)
struct CompactLeadingView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        // Simple tally representation
        TallyMarkView(count: min(context.state.sessionCount, 5), size: 16)
    }
}

@available(iOS 17.0, *)
struct CompactTrailingView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        Text("+\(context.state.sessionCount)")
            .font(.system(.caption, design: .rounded, weight: .semibold))
            .foregroundStyle(Color.tallyAccent)
    }
}

@available(iOS 17.0, *)
struct MinimalView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        Text("\(context.state.sessionCount)")
            .font(.system(.caption, design: .rounded, weight: .bold))
            .foregroundStyle(Color.tallyAccent)
    }
}

@available(iOS 17.0, *)
struct ExpandedLeadingView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Session")
                .font(.caption2)
                .foregroundStyle(.secondary)
            
            Text("+\(context.state.sessionCount)")
                .font(.title2.weight(.bold))
                .foregroundStyle(Color.tallyAccent)
        }
    }
}

@available(iOS 17.0, *)
struct ExpandedTrailingView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        VStack(alignment: .trailing) {
            Text("Total")
                .font(.caption2)
                .foregroundStyle(.secondary)
            
            Text("\(context.state.totalCount)")
                .font(.title2.weight(.semibold))
        }
    }
}

@available(iOS 17.0, *)
struct ExpandedCenterView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        Text(context.attributes.challengeName)
            .font(.headline)
            .lineLimit(1)
    }
}

@available(iOS 17.0, *)
struct ExpandedBottomView: View {
    let context: ActivityViewContext<TallyActivityAttributes>
    
    var body: some View {
        VStack(spacing: TallySpacing.xs) {
            // Tally marks for session
            TallyMarkView(count: context.state.sessionCount, size: 32)
            
            // Progress bar
            HStack {
                Text("\(context.state.totalCount)")
                    .font(.caption)
                
                ProgressView(value: context.state.progress)
                    .tint(Color.tallyAccent)
                
                Text("\(context.state.target)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
