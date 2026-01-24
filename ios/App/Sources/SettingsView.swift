import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureTipJar

/// Settings view accessible from user profile
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showTipJar = false
    
    var body: some View {
        NavigationStack {
            List {
                // Support section
                Section {
                    Button {
                        showTipJar = true
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Support Development")
                                Text("Leave a tip")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "heart.fill")
                                .foregroundStyle(.pink)
                        }
                    }
                } header: {
                    Text("Support")
                }
                
                // Account section
                Section {
                    SignOutButton()
                } header: {
                    Text("Account")
                }
                
                // App info
                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                            .foregroundStyle(.secondary)
                    }
                } header: {
                    Text("About")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showTipJar) {
                NavigationStack {
                    TipJarView()
                        .navigationTitle("Tip Jar")
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            ToolbarItem(placement: .confirmationAction) {
                                Button("Done") {
                                    showTipJar = false
                                }
                            }
                        }
                }
                .presentationDetents([.medium])
            }
        }
    }
}

#Preview {
    SettingsView()
}
