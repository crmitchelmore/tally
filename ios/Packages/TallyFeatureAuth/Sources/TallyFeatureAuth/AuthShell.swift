import SwiftUI
import TallyCore

public struct AuthShell: View {
    let onSignIn: @Sendable () async -> Void

    public init(onSignIn: @escaping @Sendable () async -> Void) {
        self.onSignIn = onSignIn
    }

    public var body: some View {
        VStack(spacing: 32) {
            TallyMarkStack()
                .frame(height: 120)
                .accessibilityHidden(true)

            VStack(spacing: 12) {
                Text("Stay on pace.")
                    .font(.system(.largeTitle, design: .serif).weight(.bold))
                    .multilineTextAlignment(.center)
                Text("Mark progress that feels like ink on paper—calm, honest, offline-first.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button(action: {
                Task {
                    await onSignIn()
                }
            }) {
                Label("Continue with Clerk", systemImage: "pencil.tip")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(red: 0.75, green: 0.07, blue: 0.07))
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(.plain)
            .accessibilityHint("Opens Clerk sign-in to continue tracking challenges.")

            Text("Offline-friendly, honest progress. No streak panic.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding(32)
        .frame(maxWidth: 420)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.12), radius: 20, y: 10)
        )
        .padding()
    }
}

private struct TallyMarkStack: View {
    var body: some View {
        HStack(alignment: .bottom, spacing: 14) {
            ForEach(0..<4) { index in
                Capsule()
                    .fill(Color.secondary.opacity(0.6))
                    .frame(width: 10, height: CGFloat(60 + index * 8))
            }
            Capsule()
                .fill(Color(red: 0.75, green: 0.07, blue: 0.07))
                .frame(width: 10, height: 100)
                .rotationEffect(.degrees(-18), anchor: .topLeading)
                .offset(x: -30)
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: UUID())
        .accessibilityHidden(true)
    }
}

#Preview {
    AuthShell(onSignIn: {})
        .preferredColorScheme(.light)
}
