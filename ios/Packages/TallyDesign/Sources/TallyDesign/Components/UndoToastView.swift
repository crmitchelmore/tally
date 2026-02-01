import SwiftUI

public struct UndoToastView: View {
    let message: String
    let onUndo: () -> Void
    let onDismiss: () -> Void
    let duration: TimeInterval
    
    @State private var progress: CGFloat = 1.0
    @State private var timer: Timer?
    
    public init(
        message: String,
        duration: TimeInterval = 5.0,
        onUndo: @escaping () -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.message = message
        self.duration = duration
        self.onUndo = onUndo
        self.onDismiss = onDismiss
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: TallySpacing.md) {
                Text(message)
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyPaper)
                
                Spacer()
                
                Button(action: onUndo) {
                    Text("Undo")
                        .font(.tallyLabelMedium)
                        .foregroundColor(Color.tallyPaper)
                        .padding(.horizontal, TallySpacing.sm)
                        .padding(.vertical, TallySpacing.xs)
                        .background(Color.tallyPaper.opacity(0.2))
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
                
                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.caption)
                        .foregroundColor(Color.tallyPaper.opacity(0.7))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Dismiss")
            }
            .tallyPadding(.horizontal, TallySpacing.md)
            .tallyPadding(.vertical, TallySpacing.sm)
            
            Rectangle()
                .fill(Color.tallyAccent)
                .frame(height: 2)
                .frame(maxWidth: .infinity, alignment: .leading)
                .scaleEffect(x: progress, y: 1, anchor: .leading)
        }
        .background(Color.tallyInk)
        .cornerRadius(12)
        .shadow(color: Color.tallyInk.opacity(0.2), radius: 8, x: 0, y: 4)
        .onAppear {
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private func startTimer() {
        progress = 1.0
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { _ in
            progress -= CGFloat(0.05 / duration)
            if progress <= 0 {
                timer?.invalidate()
                onDismiss()
            }
        }
    }
}

#Preview {
    UndoToastView(message: "Challenge deleted", onUndo: {}, onDismiss: {})
        .padding()
}
