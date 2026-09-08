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
        modifier(TallyAnimationModifier(animation: animation, value: value, disabled: reducedMotion))
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


private struct TallyAnimationModifier<Value: Equatable>: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let animation: Animation?
    let value: Value
    let disabled: Bool

    func body(content: Content) -> some View {
        content.animation(reduceMotion || disabled ? nil : animation, value: value)
    }
}

/// Tactile feedback without changing button semantics or its hit target.
public struct TallyPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.98 : 1)
            .opacity(configuration.isPressed ? 0.82 : 1)
            .animation(reduceMotion ? nil : .spring(duration: 0.22, bounce: 0.15), value: configuration.isPressed)
    }
}

private struct TallyValueFeedback: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let value: Int
    let enabled: Bool
    @State private var trigger = 0

    func body(content: Content) -> some View {
        content
            .keyframeAnimator(initialValue: CGFloat(1), trigger: trigger) { view, scale in
                view.scaleEffect(reduceMotion || !enabled ? 1 : scale, anchor: .leading)
            } keyframes: { _ in
                CubicKeyframe(1.035, duration: 0.10)
                SpringKeyframe(1, duration: 0.22, spring: .smooth)
            }
            .onChange(of: value) { previous, current in
                if enabled && !reduceMotion && current > previous { trigger += 1 }
            }
    }
}

public extension View {
    /// A small celebration only for a new count; opening a screen stays still.
    func tallyValueFeedback(value: Int, enabled: Bool = true) -> some View {
        modifier(TallyValueFeedback(value: value, enabled: enabled))
    }
}
