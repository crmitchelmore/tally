import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureTipJar
import TallyFeatureAPIClient

/// Settings view accessible from user profile
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showTipJar = false
    @State private var showExportSheet = false
    @State private var showImportPicker = false
    @State private var showDeleteConfirm = false
    @State private var isExporting = false
    @State private var isImporting = false
    @State private var exportedData: ExportDataResponse?
    @State private var alertMessage: String?
    @State private var showAlert = false
    
    var body: some View {
        NavigationStack {
            List {
                // Data Management section
                Section {
                    // Export data
                    Button {
                        Task { await exportData() }
                    } label: {
                        Label {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Export Data")
                                    Text("Download your challenges and entries")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if isExporting {
                                    ProgressView()
                                }
                            }
                        } icon: {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundStyle(Color.tallyAccent)
                        }
                    }
                    .disabled(isExporting)
                    
                    // Import data
                    Button {
                        showImportPicker = true
                    } label: {
                        Label {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Import Data")
                                    Text("Restore from a backup file")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if isImporting {
                                    ProgressView()
                                }
                            }
                        } icon: {
                            Image(systemName: "square.and.arrow.down")
                                .foregroundStyle(Color.tallySuccess)
                        }
                    }
                    .disabled(isImporting)
                    
                    // Delete all data
                    Button(role: .destructive) {
                        showDeleteConfirm = true
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Delete All Data")
                                Text("Remove all challenges and entries")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "trash")
                                .foregroundStyle(Color.tallyError)
                        }
                    }
                } header: {
                    Text("Data")
                } footer: {
                    Text("Export creates a JSON file you can use to back up or transfer your data.")
                }
                
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
            .sheet(isPresented: $showExportSheet) {
                if let data = exportedData {
                    ExportShareSheet(data: data)
                }
            }
            .fileImporter(
                isPresented: $showImportPicker,
                allowedContentTypes: [.json],
                allowsMultipleSelection: false
            ) { result in
                Task { await handleImport(result) }
            }
            .alert("Delete All Data?", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    Task { await deleteAllData() }
                }
            } message: {
                Text("This will permanently delete all your challenges and entries. This action cannot be undone.")
            }
            .alert("Notice", isPresented: $showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }
    
    // MARK: - Data Operations
    
    private func exportData() async {
        isExporting = true
        defer { isExporting = false }
        
        do {
            let data = try await APIClient.shared.exportData()
            exportedData = data
            showExportSheet = true
        } catch {
            alertMessage = "Failed to export data: \(error.localizedDescription)"
            showAlert = true
        }
    }
    
    private func handleImport(_ result: Result<[URL], Error>) async {
        isImporting = true
        defer { isImporting = false }
        
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            
            do {
                guard url.startAccessingSecurityScopedResource() else {
                    alertMessage = "Could not access the selected file"
                    showAlert = true
                    return
                }
                defer { url.stopAccessingSecurityScopedResource() }
                
                let jsonData = try Data(contentsOf: url)
                let importData = try JSONDecoder().decode(ImportDataRequest.self, from: jsonData)
                
                let response = try await APIClient.shared.importData(importData)
                
                alertMessage = "Imported \(response.imported.challenges) challenges and \(response.imported.entries) entries"
                showAlert = true
            } catch {
                alertMessage = "Failed to import data: \(error.localizedDescription)"
                showAlert = true
            }
            
        case .failure(let error):
            alertMessage = "Could not select file: \(error.localizedDescription)"
            showAlert = true
        }
    }
    
    private func deleteAllData() async {
        do {
            _ = try await APIClient.shared.clearData()
            alertMessage = "All data has been deleted"
            showAlert = true
        } catch {
            alertMessage = "Failed to delete data: \(error.localizedDescription)"
            showAlert = true
        }
    }
}

// MARK: - Export Share Sheet

struct ExportShareSheet: View {
    let data: ExportDataResponse
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack(spacing: TallySpacing.lg) {
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 64))
                    .foregroundColor(Color.tallyAccent)
                
                Text("Export Ready")
                    .font(.tallyTitleMedium)
                    .foregroundColor(Color.tallyInk)
                
                Text("\(data.challenges.count) challenges, \(data.entries.count) entries")
                    .font(.tallyBodyMedium)
                    .foregroundColor(Color.tallyInkSecondary)
                
                if let jsonData = try? JSONEncoder().encode(data),
                   let jsonString = String(data: jsonData, encoding: .utf8) {
                    ShareLink(
                        item: jsonString,
                        subject: Text("Tally Export"),
                        message: Text("My Tally data export")
                    ) {
                        Label("Share", systemImage: "square.and.arrow.up")
                            .font(.tallyTitleSmall)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.tallyAccent)
                }
            }
            .padding()
            .navigationTitle("Export Data")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    SettingsView()
}
