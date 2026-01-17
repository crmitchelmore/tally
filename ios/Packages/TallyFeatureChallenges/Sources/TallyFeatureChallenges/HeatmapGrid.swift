import SwiftUI

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
                            .stroke(Color(.systemGray5), lineWidth: 0.5)
                    )
                    .accessibilityLabel("\(day.date) \(day.count) tallies")
            }
        }
    }

    private func color(for count: Int) -> Color {
        switch count {
        case 0:
            return Color(.systemGray6)
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
