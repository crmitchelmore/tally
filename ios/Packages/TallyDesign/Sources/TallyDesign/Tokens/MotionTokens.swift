import SwiftUI

/// Animation durations and easing for Tally
public enum TallyMotion {
    // MARK: - Durations
    
    /// Quick interactions (120ms)
    public static let quick: Double = 0.12
    
    /// Standard interactions (220ms)
    public static let standard: Double = 0.22
    
    /// Deliberate animations (350ms)
    public static let deliberate: Double = 0.35
    
    /// Hero/onboarding moments (420ms)
    public static let hero: Double = 0.42
    
    // MARK: - Easing
    
    /// Standard easing curve (ease-in-out)
    public static let ease = Animation.easeInOut(duration: standard)
    
    /// Quick easing for micro-interactions
    public static let easeQuick = Animation.easeInOut(duration: quick)
    
    /// Deliberate easing for important transitions
    public static let easeDeliberate = Animation.easeInOut(duration: deliberate)
    
    /// Hero easing with spring
    public static let easeHero = Animation.spring(duration: hero, bounce: 0.25)
    
    // MARK: - Tally Stroke Drawing
    
    /// Stroke drawing animation (feels like pen on paper)
    public static let strokeDraw = Animation.easeOut(duration: 0.28)
    
    /// Slash drawing animation (5th mark - slightly faster)
    public static let slashDraw = Animation.easeOut(duration: 0.20)
}

public extension View {
    /// Apply animation with reduce motion check
    /// - Parameters:
    ///   - animation: The animation to apply
    ///   - value: The value to observe for changes
    ///   - reducedMotionValue: Optional value to use when reduce motion is enabled
    func tallyAnimation<V: Equatable>(
        _ animation: Animation?,
        value: V,
        reducedMotion: Bool = false
    ) -> some View {
        self.animation(reducedMotion ? nil : animation, value: value)
    }
}

public extension Animation {
    /// Create animation that respects reduce motion settings
    static func tallyRespectingMotion(
        _ animation: Animation,
        reduceMotion: Bool
    ) -> Animation? {
        reduceMotion ? nil : animation
    }
}
