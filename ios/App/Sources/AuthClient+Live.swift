import Clerk
import Foundation
import TallyCore

private enum AuthConstants {
    static let tokenKey = "clerk.jwt"
}

extension AuthClient {
    static func live(apiBaseURL: URL) -> AuthClient {
        AuthClient(
            currentUser: {
                try await MainActor.run {
                    guard let user = Clerk.shared.user else {
                        return nil
                    }
                    return User(
                        id: user.id,
                        email: user.primaryEmailAddress?.emailAddress ?? "",
                        displayName: user.firstName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "Tally"
                    )
                }
            },
            signIn: {
                let user = try await MainActor.run { Clerk.shared.user }
                guard let user else {
                    throw AuthError.missingUser
                }
                guard user.primaryEmailAddress?.emailAddress != nil else {
                    throw AuthError.invalidUser
                }
                let session = await MainActor.run { Clerk.shared.session }
                guard let tokenResource = try await session?.getToken() else {
                    throw AuthError.missingToken
                }
                let token = tokenResource.jwt
                guard !token.isEmpty else {
                    throw AuthError.invalidToken
                }
                try KeychainStore.set(token, for: AuthConstants.tokenKey)
                return User(
                    id: user.id,
                    email: user.primaryEmailAddress?.emailAddress ?? "",
                    displayName: user.firstName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "Tally"
                )
            },
            signOut: {
                try await Clerk.shared.signOut()
                try KeychainStore.delete(AuthConstants.tokenKey)
            },
            syncUser: {
                let session = await MainActor.run { Clerk.shared.session }
                guard let session else {
                    throw AuthError.missingSession
                }
                guard let tokenResource = try await session.getToken() else {
                    throw AuthError.missingToken
                }
                let token = tokenResource.jwt
                guard !token.isEmpty else {
                    throw AuthError.invalidToken
                }
                try KeychainStore.set(token, for: AuthConstants.tokenKey)
                let client = APIClient(baseURL: apiBaseURL)
                try await client.postAuthUser(token: token)
            }
        )
    }
}
