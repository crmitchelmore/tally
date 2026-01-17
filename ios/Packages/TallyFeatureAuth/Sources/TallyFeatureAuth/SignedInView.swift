import SwiftUI
import TallyCore

struct SignedInView: View {
    let user: User
    let onSignOut: @Sendable () async -> Void

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("Welcome back, \(user.displayName)")
                    .font(.title2.weight(.semibold))
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("Your challenges sync across every surface. Offline edits queue until connected.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
            }

            Button(role: .destructive) {
                Task {
                    await onSignOut()
                }
            } label: {
                Text("Sign out")
                    .font(.body.weight(.medium))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.secondary)
        }
        .padding()
    }
}

#Preview {
    SignedInView(
        user: .init(id: UUID(), email: "sam@example.com", displayName: "Sam"),
        onSignOut: {}
    )
}
