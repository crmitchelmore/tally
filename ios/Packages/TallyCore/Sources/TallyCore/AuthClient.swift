import Foundation

public enum SyncStatus: Equatable, Sendable {
    case offline
    case syncing
    case queued(Int)
    case upToDate
    case failed
}

public struct AuthClient: Sendable {
    public var currentUser: @Sendable () async throws -> User?
    public var signIn: @Sendable () async throws -> User
    public var signOut: @Sendable () async throws -> Void
    public var syncUser: @Sendable () async throws -> Void

    public init(
        currentUser: @escaping @Sendable () async throws -> User?,
        signIn: @escaping @Sendable () async throws -> User,
        signOut: @escaping @Sendable () async throws -> Void,
        syncUser: @escaping @Sendable () async throws -> Void
    ) {
        self.currentUser = currentUser
        self.signIn = signIn
        self.signOut = signOut
        self.syncUser = syncUser
    }
}

public extension AuthClient {
    static let preview = AuthClient(
        currentUser: { nil },
        signIn: {
            .init(
                id: "user_preview",
                email: "sam@example.com",
                displayName: "Sam"
            )
        },
        signOut: {},
        syncUser: {}
    )
}

public extension AuthClient {
    static func makeMock(user: User? = nil) -> AuthClient {
        var state = user
        return AuthClient(
            currentUser: { state },
            signIn: {
                let signedIn = User(
                    id: "user_mock",
                    email: "mock@example.com",
                    displayName: "Mock User"
                )
                state = signedIn
                return signedIn
            },
            signOut: {
                state = nil
            },
            syncUser: {}
        )
    }
}
