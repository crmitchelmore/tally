import SwiftUI

/// A card container matching the "Ink + Momentum" design language.
/// Rounded corners, subtle border, optional shadow.
public struct TallyCard<Content: View>: View {
    let content: Content
    var showBorder: Bool
    var showShadow: Bool
    
    public init(
        showBorder: Bool = true,
        showShadow: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.showBorder = showBorder
        self.showShadow = showShadow
    }
    
    public var body: some View {
        content
            .padding(TallySpacing.md)
            .background(TallyColors.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: TallyRadius.xxl))
            .overlay(
                RoundedRectangle(cornerRadius: TallyRadius.xxl)
                    .stroke(TallyColors.cardBorder, lineWidth: showBorder ? 2 : 0)
            )
            .shadow(
                color: showShadow ? Color.black.opacity(0.08) : .clear,
                radius: 10,
                y: 4
            )
    }
}

/// Primary action button with brand accent color
public struct TallyPrimaryButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isPressed = false
    
    public init(_ title: String, icon: String? = nil, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.action = action
    }
    
    public var body: some View {
        Button(action: {
            action()
        }) {
            HStack(spacing: TallySpacing.sm) {
                if let icon {
                    Image(systemName: icon)
                        .font(.body.weight(.semibold))
                }
                Text(title)
                    .font(.body.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, TallySpacing.md)
            .padding(.horizontal, TallySpacing.lg)
            .background(isEnabled ? TallyColors.slash : Color.gray)
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: TallyRadius.xl))
        }
        .scaleEffect(isPressed && !reduceMotion ? 0.98 : 1.0)
        .animation(reduceMotion ? nil : .easeOut(duration: TallyMotion.fast), value: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

/// Secondary/outline button
public struct TallySecondaryButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    
    public init(_ title: String, icon: String? = nil, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: TallySpacing.sm) {
                if let icon {
                    Image(systemName: icon)
                        .font(.body.weight(.medium))
                }
                Text(title)
                    .font(.body.weight(.medium))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, TallySpacing.md)
            .padding(.horizontal, TallySpacing.lg)
            .background(Color.clear)
            .foregroundColor(TallyColors.ink)
            .overlay(
                RoundedRectangle(cornerRadius: TallyRadius.xl)
                    .stroke(TallyColors.cardBorder, lineWidth: 2)
            )
        }
    }
}

/// Stat display with label and value
public struct TallyStatView: View {
    let label: String
    let value: String
    let icon: String?
    let color: Color
    
    public init(_ label: String, value: String, icon: String? = nil, color: Color = .primary) {
        self.label = label
        self.value = value
        self.icon = icon
        self.color = color
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.xs) {
            HStack(spacing: TallySpacing.xs) {
                if let icon {
                    Image(systemName: icon)
                        .font(.caption)
                        .foregroundColor(color)
                }
                Text(label)
                    .tallyLabel()
            }
            Text(value)
                .tallyMediumNumber(color: color)
        }
    }
}

/// Empty state view with icon, title, message, and optional action
public struct TallyEmptyState: View {
    let icon: String
    let title: String
    let message: String
    let actionTitle: String?
    let action: (() -> Void)?
    
    public init(
        icon: String,
        title: String,
        message: String,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.title = title
        self.message = message
        self.actionTitle = actionTitle
        self.action = action
    }
    
    public var body: some View {
        VStack(spacing: TallySpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text(title)
                .font(TallyTypography.sectionHeader())
            
            Text(message)
                .font(TallyTypography.secondary())
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            if let actionTitle, let action {
                TallyPrimaryButton(actionTitle, action: action)
                    .padding(.top, TallySpacing.sm)
            }
        }
        .padding(TallySpacing.xl)
    }
}

#Preview("Card") {
    TallyCard {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            Text("Challenge Name")
                .font(TallyTypography.sectionHeader())
            Text("100 / 1000")
                .tallyMediumNumber()
        }
    }
    .padding()
}

#Preview("Buttons") {
    VStack(spacing: TallySpacing.md) {
        TallyPrimaryButton("Add Entry", icon: "plus") {}
        TallySecondaryButton("Settings", icon: "gear") {}
    }
    .padding()
}

#Preview("Empty State") {
    TallyEmptyState(
        icon: "target",
        title: "No Challenges Yet",
        message: "Create your first challenge to start tracking progress.",
        actionTitle: "Create Challenge"
    ) {}
}
