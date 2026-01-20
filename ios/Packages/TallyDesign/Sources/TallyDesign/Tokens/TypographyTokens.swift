import SwiftUI

public extension Font {
    /// Typography tokens using SF Pro and system fonts with Dynamic Type support
    
    // MARK: - Display
    
    /// Large display text (hero numbers, totals)
    static let tallyDisplayLarge = Font.system(size: 56, weight: .bold, design: .rounded)
    
    /// Medium display text
    static let tallyDisplayMedium = Font.system(size: 40, weight: .semibold, design: .rounded)
    
    /// Small display text
    static let tallyDisplaySmall = Font.system(size: 32, weight: .semibold, design: .rounded)
    
    // MARK: - Title
    
    /// Large title
    static let tallyTitleLarge = Font.system(size: 28, weight: .bold)
    
    /// Medium title
    static let tallyTitleMedium = Font.system(size: 22, weight: .semibold)
    
    /// Small title
    static let tallyTitleSmall = Font.system(size: 20, weight: .semibold)
    
    // MARK: - Body
    
    /// Large body text
    static let tallyBodyLarge = Font.system(size: 17, weight: .regular)
    
    /// Medium body text (default)
    static let tallyBodyMedium = Font.system(size: 15, weight: .regular)
    
    /// Small body text
    static let tallyBodySmall = Font.system(size: 13, weight: .regular)
    
    // MARK: - Label
    
    /// Large label
    static let tallyLabelLarge = Font.system(size: 15, weight: .medium)
    
    /// Medium label
    static let tallyLabelMedium = Font.system(size: 13, weight: .medium)
    
    /// Small label (captions, metadata)
    static let tallyLabelSmall = Font.system(size: 11, weight: .medium)
    
    // MARK: - Monospaced (for counts/numbers)
    
    /// Monospaced display numbers
    static let tallyMonoDisplay = Font.system(size: 40, weight: .semibold, design: .monospaced)
    
    /// Monospaced body numbers
    static let tallyMonoBody = Font.system(size: 17, weight: .regular, design: .monospaced)
}

public extension Text {
    /// Apply Dynamic Type scaling while respecting accessibility settings
    func tallyScaled() -> some View {
        self.dynamicTypeSize(...DynamicTypeSize.accessibility3)
    }
}
