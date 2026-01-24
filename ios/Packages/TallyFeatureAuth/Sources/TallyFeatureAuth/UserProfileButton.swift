import SwiftUI
import TallyCore
import TallyDesign
import Clerk

/// User profile button that shows the user's avatar
public struct UserProfileButton: View {
    @Bindable private var authManager = AuthManager.shared
    @State private var showProfile = false
    
    /// Closure called when user wants to open settings from profile
    public var onOpenSettings: (() -> Void)?
    
    public init(onOpenSettings: (() -> Void)? = nil) {
        self.onOpenSettings = onOpenSettings
    }
    
    public var body: some View {
        Button {
            showProfile = true
        } label: {
            if let imageUrl = authManager.currentUser?.imageUrl,
               let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure, .empty:
                        placeholderImage
                    @unknown default:
                        placeholderImage
                    }
                }
                .frame(width: 32, height: 32)
                .clipShape(Circle())
            } else {
                placeholderImage
            }
        }
        .accessibilityLabel("Profile")
        .accessibilityHint("Opens your profile settings")
        .sheet(isPresented: $showProfile) {
            UserProfileView(onOpenSettings: onOpenSettings)
                .presentationDragIndicator(.visible)
        }
    }
    
    private var placeholderImage: some View {
        Circle()
            .fill(Color.tallyInkTertiary.opacity(0.2))
            .frame(width: 32, height: 32)
            .overlay {
                Image(systemName: "person.fill")
                    .font(.system(size: 16))
                    .foregroundColor(.tallyInkSecondary)
            }
    }
}

/// Sign out button
public struct SignOutButton: View {
    @Bindable private var authManager = AuthManager.shared
    
    public init() {}
    
    public var body: some View {
        Button(role: .destructive) {
            Task {
                await authManager.signOut()
            }
        } label: {
            Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
        }
    }
}

#Preview {
    HStack {
        UserProfileButton()
        SignOutButton()
    }
    .padding()
}
