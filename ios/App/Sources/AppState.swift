import Foundation
import SwiftUI
import TallyCore
import TallyFeatureAPIClient

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
    @Published var apiClientStore: APIClientStore?
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
                await configureAPIClient()
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
            await configureAPIClient()
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
            apiClientStore = nil
            syncStatus = .upToDate
            authErrorMessage = nil
        } catch {
            syncStatus = .failed
            authErrorMessage = error.localizedDescription
        }
    }

    private func configureAPIClient() async {
        do {
            let baseURL = try ClerkEnvironment.apiBaseURL()
            let tokenProvider: @Sendable () async throws -> String = {
                guard let token = try KeychainStore.get(AuthConstants.tokenKey) else {
                    throw APIClientError.missingToken
                }
                return token
            }
            let client = TallyFeatureAPIClient.APIClient(baseURL: baseURL, tokenProvider: tokenProvider)
            let store = APIClientStore(client: client)
            apiClientStore = store
            await store.refresh(activeOnly: true)
        } catch {
            apiClientStore = nil
            authErrorMessage = error.localizedDescription
        }
    }
}
