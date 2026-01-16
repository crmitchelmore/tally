import SwiftUI

struct SignUpView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AuthManager.self) private var authManager
    
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 16) {
                    TextField("Name", text: $name)
                        .textContentType(.name)
                        .autocapitalization(.words)
                        .padding()
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(12)
                    
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding()
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(12)
                    
                    SecureField("Password", text: $password)
                        .textContentType(.newPassword)
                        .padding()
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(12)
                    
                    SecureField("Confirm Password", text: $confirmPassword)
                        .textContentType(.newPassword)
                        .padding()
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(12)
                    
                    if !confirmPassword.isEmpty && password != confirmPassword {
                        Text("Passwords don't match")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                if let error = authManager.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                Button {
                    Task {
                        await authManager.signUp(email: email, password: password, name: name.isEmpty ? nil : name)
                        if authManager.isAuthenticated {
                            dismiss()
                        }
                    }
                } label: {
                    Group {
                        if authManager.isLoading {
                            ProgressView()
                        } else {
                            Text("Create Account")
                        }
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.accentColor : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(!isFormValid || authManager.isLoading)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Create Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private var isFormValid: Bool {
        !email.isEmpty && 
        email.contains("@") && 
        password.count >= 6 && 
        password == confirmPassword
    }
}

#Preview {
    SignUpView()
        .environment(AuthManager.shared)
}
