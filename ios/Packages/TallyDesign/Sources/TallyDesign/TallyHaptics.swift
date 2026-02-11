import UIKit

/// Haptic feedback generator for Tally interactions
/// Provides subtle, satisfying feedback for tally additions
/// Following design philosophy: tactile, like marking paper
public final class TallyHaptics: @unchecked Sendable {
    
    public static let shared = TallyHaptics()
    
    // MARK: - Feedback Generators
    
    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let softImpact = UIImpactFeedbackGenerator(style: .soft)
    private let rigidImpact = UIImpactFeedbackGenerator(style: .rigid)
    private let selectionFeedback = UISelectionFeedbackGenerator()
    private let notificationFeedback = UINotificationFeedbackGenerator()
    
    private init() {
        // Prepare generators for lower latency
        prepareAll()
    }
    
    /// Prepare all generators for immediate use
    public func prepareAll() {
        lightImpact.prepare()
        mediumImpact.prepare()
        softImpact.prepare()
        selectionFeedback.prepare()
    }
    
    // MARK: - Entry Haptics
    
    /// Light tap when adding a single tally mark (1 count)
    /// Feels like a pen touching paper
    public func tallyTap() {
        softImpact.impactOccurred(intensity: 0.5)
        softImpact.prepare()
    }
    
    /// Medium tap for adding multiple tallies
    /// Slightly more satisfying for bigger additions
    public func tallyBatch() {
        lightImpact.impactOccurred(intensity: 0.7)
        lightImpact.prepare()
    }
    
    /// Satisfying thud when completing a five-gate (5 tallies)
    /// The diagonal slash moment
    public func fiveGateComplete() {
        mediumImpact.impactOccurred(intensity: 0.8)
        mediumImpact.prepare()
    }
    
    /// Notable feedback for completing 25 (full X layout)
    public func twentyFiveComplete() {
        rigidImpact.impactOccurred(intensity: 0.9)
        rigidImpact.prepare()
    }
    
    /// Strong feedback for completing 100
    public func hundredComplete() {
        heavyImpact.impactOccurred(intensity: 1.0)
        heavyImpact.prepare()
    }
    
    // MARK: - Milestone Haptics
    
    /// Success notification for reaching target
    public func targetReached() {
        notificationFeedback.notificationOccurred(.success)
        notificationFeedback.prepare()
    }
    
    /// Streak milestone feedback
    public func streakMilestone() {
        notificationFeedback.notificationOccurred(.success)
        notificationFeedback.prepare()
    }
    
    /// Personal record achieved
    public func personalRecord() {
        // Double tap pattern for extra celebration
        heavyImpact.impactOccurred(intensity: 1.0)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.mediumImpact.impactOccurred(intensity: 0.8)
        }
    }
    
    // MARK: - UI Haptics
    
    /// Selection change (picker, segment)
    public func selection() {
        selectionFeedback.selectionChanged()
        selectionFeedback.prepare()
    }
    
    /// Button press feedback
    public func buttonPress() {
        lightImpact.impactOccurred(intensity: 0.5)
        lightImpact.prepare()
    }
    
    /// Error/warning feedback
    public func error() {
        notificationFeedback.notificationOccurred(.error)
        notificationFeedback.prepare()
    }
    
    /// Warning feedback
    public func warning() {
        notificationFeedback.notificationOccurred(.warning)
        notificationFeedback.prepare()
    }
    
    // MARK: - Smart Haptics
    
    /// Provide appropriate haptic based on count milestone
    /// - Parameter count: The new total count after addition
    public func hapticForCount(_ count: Int) {
        // Check for major milestones first
        if count % 100 == 0 && count > 0 {
            hundredComplete()
        } else if count % 25 == 0 && count > 0 {
            twentyFiveComplete()
        } else if count % 5 == 0 && count > 0 {
            fiveGateComplete()
        } else {
            tallyTap()
        }
    }
    
    /// Provide appropriate haptic for session count increase
    /// - Parameters:
    ///   - newSessionCount: Current session count
    ///   - increment: How much was just added
    public func hapticForSession(newSessionCount: Int, increment: Int) {
        if increment > 1 {
            tallyBatch()
        } else {
            hapticForCount(newSessionCount)
        }
    }
}
