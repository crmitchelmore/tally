import SwiftUI
import TallyCore
import TallyDesign
import Clerk

/// Sign-in screen for unauthenticated users
public struct SignInView: View {
    @Environment(\.clerk) private var clerk
    @Bindable private var authManager = AuthManager.shared
    @State private var showAuthView = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    public init() {}
    
    public var body: some View {
        ZStack {
            // Paper background
            Color.tallyPaper
                .ignoresSafeArea()
            
            VStack(spacing: TallySpacing.xl) {
                Spacer()
                
                // Logo / brand area
                VStack(spacing: TallySpacing.md) {
                    // Tally mark as logo
                    TallyMarkView(count: 5)
                        .frame(width: 80, height: 80)
                        .accessibilityLabel("Tally logo")
                    
                    Text("Tally")
                        .font(.tallyDisplayMedium)
                        .foregroundColor(.tallyInk)
                    
                    Text("Track what matters")
                        .font(.tallyBodyMedium)
                        .foregroundColor(.tallyInkSecondary)
                }
                
                Spacer()
                
                // Sign in CTA
                VStack(spacing: TallySpacing.md) {
                    Button {
                        showAuthView = true
                    } label: {
                        Text("Sign in")
                            .font(.tallyLabelLarge)
                            .foregroundColor(.tallyPaper)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, TallySpacing.md)
                            .background(Color.tallyAccent)
                            .cornerRadius(12)
                    }
                    .accessibilityHint("Opens sign in screen")
                    
                    Button {
                        authManager.enableOfflineMode()
                    } label: {
                        Text("Continue without account")
                            .font(.tallyLabelMedium)
                            .foregroundColor(.tallyInkSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, TallySpacing.md)
                            .background(Color.tallyPaper)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.tallyInkTertiary, lineWidth: 1)
                            )
                            .cornerRadius(12)
                    }
                    .accessibilityHint("Use app offline without syncing")
                    
                    Text("Your data stays on this device in offline mode.")
                        .font(.tallyBodySmall)
                        .foregroundColor(.tallyInkTertiary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, TallySpacing.xl)
                .padding(.bottom, TallySpacing.xxl)
            }
        }
        .sheet(isPresented: $showAuthView) {
            AuthView()
                .presentationDragIndicator(.visible)
        }
    }
}

#Preview {
    SignInView()
}
