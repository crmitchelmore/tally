import SwiftUI

/// Consistent spacing scale for layouts
public enum TallySpacing {
    /// 4pt - Minimum touch spacing
    public static let xs: CGFloat = 4
    
    /// 8pt - Tight spacing
    public static let sm: CGFloat = 8
    
    /// 12pt - Comfortable spacing
    public static let md: CGFloat = 12
    
    /// 16pt - Default spacing
    public static let base: CGFloat = 16
    
    /// 24pt - Section spacing
    public static let lg: CGFloat = 24
    
    /// 32pt - Large gaps
    public static let xl: CGFloat = 32
    
    /// 48pt - Extra large gaps
    public static let xxl: CGFloat = 48
    
    /// 64pt - Maximum gaps
    public static let xxxl: CGFloat = 64
}

public extension View {
    /// Apply consistent padding using Tally spacing scale
    func tallyPadding(_ edges: Edge.Set = .all, _ amount: CGFloat) -> some View {
        self.padding(edges, amount)
    }
    
    /// Apply default Tally padding (16pt)
    func tallyPadding(_ edges: Edge.Set = .all) -> some View {
        self.padding(edges, TallySpacing.base)
    }
}
