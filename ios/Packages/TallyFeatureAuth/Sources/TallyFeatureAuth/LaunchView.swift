import SwiftUI

public struct LaunchView: View {
    public init() {}

    public var body: some View {
        VStack(spacing: 16) {
            ProgressView("Syncing your tallies…")
                .progressViewStyle(.circular)
            Text("Keeping you on pace")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding()
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    LaunchView()
}
