import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureTipJar
import TallyFeatureAPIClient
import TallyFeatureChallenges
import Clerk

/// Settings view accessible from user profile
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable private var authManager = AuthManager.shared
    @EnvironmentObject private var appSettings: AppSettings
    @State private var showTipJar = false
    @State private var showExportSheet = false
    @State private var showImportPicker = false
    @State private var showDeleteConfirm = false
    @State private var showMergeDialog = false
    @State private var isExporting = false
    @State private var isImporting = false
    @State private var isSyncing = false
    @State private var exportedData: ExportDataResponse?
    @State private var alertMessage: String?
    @State private var showAlert = false
    @State private var showLoginFlow = false
    @State private var showSignOutConfirm = false
    
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
                    
                    // Delete local data (only in local-only mode)
                    if authManager.isLocalOnlyMode {
                        Button(role: .destructive) {
                            showDeleteConfirm = true
                        } label: {
                            Label {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Delete Local Data")
                                    Text("Remove all local challenges and entries")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            } icon: {
                                Image(systemName: "trash")
                                    .foregroundStyle(Color.tallyError)
                            }
                        }
                    }
                } header: {
                    Text("Data")
                } footer: {
                    if authManager.isLocalOnlyMode {
                        Text("Export creates a JSON file you can use to back up your local data.")
                    } else {
                        Text("Export creates a JSON file you can use to back up or transfer your data.")
                    }
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
                
                // Account section - conditional based on auth state
                Section {
                    if authManager.isLocalOnlyMode {
                        // Local-only mode: show login/signup button
                        Button {
                            Task { await handleLoginSignup() }
                        } label: {
                            Label {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Login / Sign Up")
                                        Text("Sync your data to the cloud")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    if isSyncing {
                                        ProgressView()
                                    }
                                }
                            } icon: {
                                Image(systemName: "person.circle")
                                    .foregroundStyle(Color.tallyAccent)
                            }
                        }
                        .disabled(isSyncing)
                    } else if authManager.isAuthenticated {
                        // Authenticated mode: show user profile info only
                        if let user = authManager.currentUser {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 12) {
                                    // User avatar
                                    if let imageUrl = user.imageUrl,
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
                                        .frame(width: 40, height: 40)
                                        .clipShape(Circle())
                                    } else {
                                        placeholderAvatar
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(user.displayName)
                                            .font(.headline)
                                            .foregroundColor(.tallyInk)
                                        if let email = user.email {
                                            Text(email)
                                                .font(.caption)
                                                .foregroundColor(.tallyInkSecondary)
                                        }
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        
                        // Sign out button for authenticated users
                        Button(role: .destructive) {
                            showSignOutConfirm = true
                        } label: {
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    }
                } header: {
                    Text("Account")
                } footer: {
                    if authManager.isLocalOnlyMode {
                        Text("Sign in to sync your data across devices.")
                    } else if authManager.isAuthenticated {
                        Text("Signing out will clear all local data from this device.")
                    }
                }
                
                // App info
                Section {
                    // Appearance setting
                    Picker(selection: $appSettings.appearanceMode) {
                        ForEach(AppearanceMode.allCases) { mode in
                            Text(mode.label).tag(mode)
                        }
                    } label: {
                        Label {
                            Text("Appearance")
                        } icon: {
                            Image(systemName: "circle.lefthalf.filled")
                                .foregroundStyle(Color.tallyAccent)
                        }
                    }
                    
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(appVersion)
                            .foregroundStyle(.secondary)
                    }
                    
                    HStack {
                        Text("Build")
                        Spacer()
                        Text(buildNumber)
                            .foregroundStyle(.secondary)
                    }
                    
                    if let commit = gitCommit {
                        HStack {
                            Text("Commit")
                            Spacer()
                            Text(commit)
                                .foregroundStyle(.secondary)
                                .font(.system(.body, design: .monospaced))
                        }
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
            .sheet(isPresented: $showLoginFlow) {
                AuthView()
                    .presentationDragIndicator(.visible)
            }
            .fileImporter(
                isPresented: $showImportPicker,
                allowedContentTypes: [.json],
                allowsMultipleSelection: false
            ) { result in
                Task { await handleImport(result) }
            }
            .alert("Delete Local Data?", isPresented: $showDeleteConfirm) {
                Button("Export & Delete", role: .destructive) {
                    Task { await exportAndDeleteLocalData() }
                }
                Button("Delete Only", role: .destructive) {
                    Task { await deleteLocalData() }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Would you like to export your data before deleting? This action cannot be undone.")
            }
            .alert("Merge Data?", isPresented: $showMergeDialog) {
                Button("Merge") {
                    Task { await mergeData() }
                }
                Button("Start Fresh") {
                    Task { await useServerDataOnly() }
                }
                Button("Cancel", role: .cancel) {
                    authManager.clearServerDataCheck()
                }
            } message: {
                if let serverData = authManager.serverDataCheckResult {
                    Text("Your account has \(serverData.challengeCount) challenges and \(serverData.entryCount) entries. Merge with local data or start fresh?")
                } else {
                    Text("Choose how to handle your data.")
                }
            }
            .alert("Notice", isPresented: $showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage ?? "")
            }
            .alert("Sign Out?", isPresented: $showSignOutConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task { await handleSignOut() }
                }
            } message: {
                Text("This will clear all local data from this device. Your data is safely stored in the cloud.")
            }
        }
    }
    
    // MARK: - Version Info
    
    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
    
    private var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
    
    private var gitCommit: String? {
        guard let commit = Bundle.main.infoDictionary?["GIT_COMMIT_SHA"] as? String else {
            return nil
        }
        let trimmed = commit.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
    
    // MARK: - Sign Out
    
    private func handleSignOut() async {
        // Clear local data first
        LocalChallengeStore.shared.clearAll()
        
        // Then sign out
        await authManager.signOut()
        
        dismiss()
    }
    
    private var placeholderAvatar: some View {
        Circle()
            .fill(Color.tallyInkTertiary.opacity(0.2))
            .frame(width: 40, height: 40)
            .overlay {
                Image(systemName: "person.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.tallyInkSecondary)
            }
    }
    
    // MARK: - Data Operations
    
    private func exportData() async {
        isExporting = true
        defer { isExporting = false }
        
        do {
            // For local-only mode, export from LocalChallengeStore
            // For synced mode, export from API
            let data: ExportDataResponse
            
            if authManager.isLocalOnlyMode {
                let localChallenges = LocalChallengeStore.shared.loadChallenges()
                // Note: For entries, we'd need to get them from ChallengesManager
                // For now, we'll export just challenges in local mode
                data = ExportDataResponse(
                    version: "1.0",
                    exportedAt: ISO8601DateFormatter().string(from: Date()),
                    challenges: localChallenges,
                    entries: [] // TODO: Get entries from ChallengesManager
                )
            } else {
                data = try await APIClient.shared.exportData()
            }
            
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
                
                if authManager.isLocalOnlyMode {
                    // Import to local store
                    for challenge in importData.challenges {
                        LocalChallengeStore.shared.upsertChallenge(challenge)
                    }
                    alertMessage = "Imported \(importData.challenges.count) challenges"
                    showAlert = true
                } else {
                    // Import via API
                    let response = try await APIClient.shared.importData(importData)
                    alertMessage = "Imported \(response.imported.challenges) challenges and \(response.imported.entries) entries"
                    showAlert = true
                }
            } catch {
                alertMessage = "Failed to import data: \(error.localizedDescription)"
                showAlert = true
            }
            
        case .failure(let error):
            alertMessage = "Could not select file: \(error.localizedDescription)"
            showAlert = true
        }
    }
    
    private func deleteLocalData() async {
        LocalChallengeStore.shared.clearAll()
        alertMessage = "All local data has been deleted"
        showAlert = true
    }
    
    private func exportAndDeleteLocalData() async {
        // First export
        await exportData()
        // Then delete
        await deleteLocalData()
    }
    
    private func handleLoginSignup() async {
        isSyncing = true
        
        // Get local data before login
        let localChallenges = LocalChallengeStore.shared.loadChallenges()
        let hasLocalData = !localChallenges.isEmpty
        
        // Show auth flow
        showLoginFlow = true
        
        // Wait a bit for auth to complete
        // Note: In production, we'd use a proper callback
        try? await Task.sleep(for: .seconds(2))
        
        // Check if auth succeeded
        if authManager.isAuthenticated {
            // Check if we need to merge data
            if let serverData = authManager.serverDataCheckResult, serverData.hasData && hasLocalData {
                showMergeDialog = true
            } else if hasLocalData {
                // Sync local data to server
                do {
                    try await authManager.syncLocalDataToServer(
                        localChallenges: localChallenges,
                        localEntries: [] // TODO: Get entries
                    )
                    LocalChallengeStore.shared.clearAll()
                    alertMessage = "Data synced successfully"
                    showAlert = true
                } catch {
                    alertMessage = "Failed to sync data: \(error.localizedDescription)"
                    showAlert = true
                }
            }
        }
        
        isSyncing = false
    }
    
    private func mergeData() async {
        let localChallenges = LocalChallengeStore.shared.loadChallenges()
        
        do {
            try await authManager.mergeLocalAndServerData(
                localChallenges: localChallenges,
                localEntries: [] // TODO: Get entries
            )
            LocalChallengeStore.shared.clearAll()
            authManager.clearServerDataCheck()
            alertMessage = "Data merged successfully"
            showAlert = true
        } catch {
            alertMessage = "Failed to merge data: \(error.localizedDescription)"
            showAlert = true
        }
    }
    
    private func useServerDataOnly() async {
        authManager.useServerDataOnly()
        LocalChallengeStore.shared.clearAll()
        authManager.clearServerDataCheck()
        alertMessage = "Using server data"
        showAlert = true
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
