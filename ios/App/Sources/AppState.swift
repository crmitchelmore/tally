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

    private let authClient: AuthClient

    init(route: Route = .launch, authClient: AuthClient = .preview) {
        self.route = route
        self.authClient = authClient
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
        } catch {
            syncStatus = .failed
            route = .signedOut
        }
    }

    func completeAuth() async {
        syncStatus = .syncing
        do {
            let user = try await authClient.signIn()
            route = .signedIn(user)
            syncStatus = .upToDate
        } catch {
            syncStatus = .failed
        }
    }

    func signOut() async {
        syncStatus = .syncing
        do {
            try await authClient.signOut()
            route = .signedOut
            syncStatus = .upToDate
        } catch {
            syncStatus = .failed
        }
    }
}
