import SwiftUI

struct Challenge: Identifiable {
    let id: String
    var name: String
    var targetNumber: Int
    var currentCount: Int
    var color: String
    var icon: String
    var year: Int
    var isPublic: Bool
    var daysLeft: Int
    
    var paceStatus: PaceStatus {
        let expectedProgress = Double(365 - daysLeft) / 365.0 * Double(targetNumber)
        let difference = Double(currentCount) - expectedProgress
        
        if difference > 1 {
            return .ahead
        } else if difference < -1 {
            return .behind
        } else {
            return .onPace
        }
    }
}

enum PaceStatus: String {
    case ahead = "Ahead"
    case onPace = "On pace"
    case behind = "Behind"
    
    var color: Color {
        switch self {
        case .ahead: return .green
        case .onPace: return .blue
        case .behind: return .orange
        }
    }
}

struct Entry: Identifiable {
    let id: String
    let challengeId: String
    var date: Date
    var count: Int
    var note: String?
    var feeling: Feeling?
}

enum Feeling: String, CaseIterable {
    case veryEasy = "very-easy"
    case easy = "easy"
    case moderate = "moderate"
    case hard = "hard"
    case veryHard = "very-hard"
    
    var emoji: String {
        switch self {
        case .veryEasy: return "😊"
        case .easy: return "🙂"
        case .moderate: return "😐"
        case .hard: return "😮‍💨"
        case .veryHard: return "😤"
        }
    }
}

// Color extension for hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
