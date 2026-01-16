import SwiftUI

struct SettingsView: View {
    @Environment(AuthManager.self) private var authManager
    @State private var showExportSheet = false
    @State private var showImportSheet = false
    @State private var exportedData: String?
    
    var body: some View {
        NavigationStack {
            List {
                // Profile Section
                Section("Profile") {
                    if let user = authManager.currentUser {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(Color.accentColor.opacity(0.2))
                                .frame(width: 50, height: 50)
                                .overlay {
                                    Text(user.name?.prefix(1).uppercased() ?? "?")
                                        .font(.title2.bold())
                                        .foregroundColor(.accentColor)
                                }
                            
                            VStack(alignment: .leading) {
                                Text(user.name ?? "Unknown")
                                    .font(.headline)
                                if let email = user.email {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                
                // Data Section
                Section("Data") {
                    Button {
                        exportData()
                    } label: {
                        Label("Export Data", systemImage: "square.and.arrow.up")
                    }
                    
                    Button {
                        showImportSheet = true
                    } label: {
                        Label("Import Data", systemImage: "square.and.arrow.down")
                    }
                }
                
                // About Section
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://tally-tracker.com")!) {
                        Label("Website", systemImage: "globe")
                    }
                    
                    Link(destination: URL(string: "https://tally-tracker.com/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                }
                
                // Sign Out
                Section {
                    Button(role: .destructive) {
                        authManager.signOut()
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Settings")
        }
        .sheet(isPresented: $showExportSheet) {
            if let data = exportedData {
                ShareSheet(items: [data])
            }
        }
        .sheet(isPresented: $showImportSheet) {
            ImportView()
        }
    }
    
    private func exportData() {
        Task {
            do {
                let data = try await DataPortability.shared.exportAllData()
                exportedData = data
                showExportSheet = true
            } catch {
                print("Export failed: \(error)")
            }
        }
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Import View

struct ImportView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var importText = ""
    @State private var isImporting = false
    @State private var error: String?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("Paste your exported data below:")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                TextEditor(text: $importText)
                    .font(.system(.body, design: .monospaced))
                    .frame(minHeight: 200)
                    .overlay {
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.secondary.opacity(0.3))
                    }
                
                if let error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                Button {
                    importData()
                } label: {
                    Group {
                        if isImporting {
                            ProgressView()
                        } else {
                            Text("Import")
                        }
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(importText.isEmpty ? Color.gray : Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(importText.isEmpty || isImporting)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Import Data")
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
    
    private func importData() {
        isImporting = true
        error = nil
        
        Task {
            do {
                try await DataPortability.shared.importData(from: importText)
                dismiss()
            } catch {
                self.error = "Import failed: \(error.localizedDescription)"
            }
            isImporting = false
        }
    }
}

#Preview {
    SettingsView()
        .environment(AuthManager.shared)
}
