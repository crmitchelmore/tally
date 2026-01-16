import SwiftUI

struct WelcomeView: View {
    @State private var showSignIn = false
    @State private var showSignUp = false
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Logo
            VStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.tint)
                
                Text("Tally")
                    .font(.largeTitle.bold())
                
                Text("Track your goals, build your habits")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Features
            VStack(spacing: 16) {
                FeatureRow(icon: "target", title: "Set Goals", description: "Create challenges with custom targets")
                FeatureRow(icon: "hand.tap.fill", title: "Track Progress", description: "Tap to log entries instantly")
                FeatureRow(icon: "trophy.fill", title: "Compete", description: "Join the community leaderboard")
            }
            .padding()
            
            Spacer()
            
            // Auth buttons
            VStack(spacing: 12) {
                Button {
                    showSignUp = true
                } label: {
                    Text("Get Started")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                
                Button {
                    showSignIn = true
                } label: {
                    Text("Sign In")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.secondary.opacity(0.1))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 32)
        }
        .sheet(isPresented: $showSignIn) {
            SignInView()
        }
        .sheet(isPresented: $showSignUp) {
            SignUpView()
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.tint)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
}

#Preview {
    WelcomeView()
}
