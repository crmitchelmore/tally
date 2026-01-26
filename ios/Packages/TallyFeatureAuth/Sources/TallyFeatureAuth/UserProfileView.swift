import SwiftUI
import TallyCore
import TallyDesign
import Clerk

/// User profile sheet showing account info and settings
public struct UserProfileView: View {
    @Bindable private var authManager = AuthManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var showSignOutConfirm = false
    @State private var showAuthFlow = false
    
    /// Closure called when user wants to open settings
    public var onOpenSettings: (() -> Void)?
    
    public init(onOpenSettings: (() -> Void)? = nil) {
        self.onOpenSettings = onOpenSettings
    }
    
    public var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Profile header
                VStack(spacing: 12) {
                    if let imageUrl = authManager.currentUser?.imageUrl,
                       let url = URL(string: imageUrl) {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            case .failure, .empty:
                                placeholderAvatar
                            @unknown default:
                                placeholderAvatar
                            }
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                    } else {
                        placeholderAvatar
                    }
                    
                    VStack(spacing: 4) {
                        if let user = authManager.currentUser {
                            Text(user.displayName)
                                .font(.title2.bold())
                            
                            if let email = user.email {
                                Text(email)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        } else if authManager.isLocalOnlyMode {
                            Text("Local Only")
                                .font(.title2.bold())
                            Text("Not signed in")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.top, 24)
                
                Spacer()
                
                // Actions
                VStack(spacing: 12) {
                    // Settings button (for all users)
                    if let onOpenSettings {
                        Button {
                            dismiss()
                            onOpenSettings()
                        } label: {
                            HStack {
                                Image(systemName: "gearshape")
                                Text("Settings")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.tallyInkTertiary.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                    
                    // Authenticated: Sign Out button
                    if authManager.isAuthenticated {
                        Button(role: .destructive) {
                            showSignOutConfirm = true
                        } label: {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Sign Out")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.tallyError.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                        .foregroundColor(.tallyError)
                    }
                    
                    // Local-only: Login/Signup button
                    if authManager.isLocalOnlyMode {
                        Button {
                            showAuthFlow = true
                        } label: {
                            HStack {
                                Image(systemName: "person.circle.fill")
                                Text("Login / Sign Up")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.tallyAccent.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                        .foregroundColor(.tallyAccent)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Sign Out?", isPresented: $showSignOutConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task { await handleSignOut() }
                }
            } message: {
                Text("This will clear all local data from this device. Your data is safely stored in the cloud.")
            }
            .sheet(isPresented: $showAuthFlow) {
                AuthView()
                    .presentationDragIndicator(.visible)
            }
        }
    }
    
    private func handleSignOut() async {
        await authManager.signOut()
        dismiss()
    }
    
    private var placeholderAvatar: some View {
        Circle()
            .fill(Color.tallyInkTertiary.opacity(0.2))
            .frame(width: 80, height: 80)
            .overlay {
                Image(systemName: "person.fill")
                    .font(.system(size: 32))
                    .foregroundColor(.tallyInkSecondary)
            }
    }
}

#Preview {
    UserProfileView()
}
