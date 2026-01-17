import Foundation
import SwiftUI
import TallyCore

@MainActor
final class AppState: ObservableObject {
    enum Route: Equatable {
        case launch
        case signedOut
        case signedIn(User)
    }

    @Published var route: Route = .launch
    @Published var syncStatus: SyncStatus = .upToDate
    @Published var authErrorMessage: String?
    private var bootstrapError: String?

    private let authClient: AuthClient

    init(route: Route, authClient: AuthClient, bootstrapError: String? = nil) {
        self.route = route
        self.authClient = authClient
        self.bootstrapError = bootstrapError
    }

    convenience init() {
        self.init(route: .launch)
    }

    convenience init(route: Route = .launch) {
        let authClient: AuthClient
        let bootstrapError: String?
        do {
            let baseURL = try ClerkEnvironment.apiBaseURL()
            authClient = .live(apiBaseURL: baseURL)
            bootstrapError = nil
        } catch {
            authClient = .preview
            bootstrapError = error.localizedDescription
        }
        self.init(route: route, authClient: authClient, bootstrapError: bootstrapError)
    }

    func bootstrap() async {
        syncStatus = .syncing
        do {
            if let user = try await authClient.currentUser() {
                route = .signedIn(user)
            } else {
                route = .signedOut
            }
            syncStatus = .upToDate
            authErrorMessage = nil
        } catch {
            syncStatus = .failed
            route = .signedOut
            authErrorMessage = error.localizedDescription
        }
    }

    func failBootstrapping() async {
        syncStatus = .failed
        route = .signedOut
        authErrorMessage = bootstrapError ?? "Unable to load authentication."
    }

    func completeAuth() async {
        syncStatus = .syncing
        do {
            let user = try await authClient.signIn()
            try await authClient.syncUser()
            route = .signedIn(user)
            syncStatus = .upToDate
            authErrorMessage = nil
        } catch {
            syncStatus = .failed
            authErrorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        syncStatus = .syncing
        do {
            try await authClient.signOut()
            route = .signedOut
            syncStatus = .upToDate
            authErrorMessage = nil
        } catch {
            syncStatus = .failed
            authErrorMessage = error.localizedDescription
        }
    }
}
