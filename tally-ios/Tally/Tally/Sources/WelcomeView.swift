import SwiftUI

struct WelcomeView: View {
    let onSignIn: () -> Void
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Logo/Hero
            VStack(spacing: 16) {
                Image(systemName: "checklist")
                    .font(.system(size: 64))
                    .foregroundColor(.accentColor)
                
                Text("Tally")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Track your yearly goals\nwith honest, focused numbers.")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Spacer()
            
            // CTA buttons
            VStack(spacing: 12) {
                Button(action: onSignIn) {
                    Text("Get Started")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                
                Button(action: onSignIn) {
                    Text("I already have an account")
                        .font(.subheadline)
                        .foregroundColor(.accentColor)
                }
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
        .background(Color(.systemBackground))
    }
}

#Preview {
    WelcomeView(onSignIn: {})
}
