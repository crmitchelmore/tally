import SwiftUI

struct SettingsView: View {
    @State private var showExportSheet = false
    @State private var showImportSheet = false
    @State private var showClearConfirm = false
    
    var body: some View {
        NavigationStack {
            List {
                Section("Data") {
                    Button(action: { showExportSheet = true }) {
                        Label("Export Data", systemImage: "square.and.arrow.up")
                    }
                    
                    Button(action: { showImportSheet = true }) {
                        Label("Import Data", systemImage: "square.and.arrow.down")
                    }
                    
                    Button(role: .destructive, action: { showClearConfirm = true }) {
                        Label("Clear All Data", systemImage: "trash")
                    }
                }
                
                Section("Account") {
                    Button(role: .destructive, action: {}) {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Clear All Data?", isPresented: $showClearConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Delete Everything", role: .destructive) {}
            } message: {
                Text("This will permanently delete all your challenges and entries. This action cannot be undone.")
            }
        }
    }
}

#Preview {
    SettingsView()
}
