import SwiftUI

#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

struct HeatmapGrid: View {
    let days: [HeatmapDay]

    var body: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
        LazyVGrid(columns: columns, spacing: 4) {
            ForEach(days) { day in
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .fill(color(for: day.count))
                    .frame(height: 16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                            .stroke(mutedStroke, lineWidth: 0.5)
                    )
                    .accessibilityLabel("\(day.date) \(day.count) tallies")
            }
        }
    }

    private func color(for count: Int) -> Color {
        switch count {
        case 0:
            return mutedFill
        case 1:
            return Color(red: 0.85, green: 0.76, blue: 0.76)
        case 2:
            return Color(red: 0.78, green: 0.52, blue: 0.53)
        case 3:
            return Color(red: 0.72, green: 0.35, blue: 0.36)
        default:
            return Color(red: 0.68, green: 0.12, blue: 0.14)
        }
    }
}

private var mutedFill: Color {
#if canImport(UIKit)
    return Color(uiColor: .systemGray6)
#elseif canImport(AppKit)
    return Color(nsColor: .controlBackgroundColor)
#else
    return Color.gray.opacity(0.1)
#endif
}

private var mutedStroke: Color {
#if canImport(UIKit)
    return Color(uiColor: .systemGray5)
#elseif canImport(AppKit)
    return Color(nsColor: .separatorColor)
#else
    return Color.gray.opacity(0.3)
#endif
}
