import Clerk
import Foundation
import TallyCore

enum AuthConstants {
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
            },
            onAuthEvent: { event in
                guard let context = TelemetryStore.shared.contextProvider?() else { return }
                guard let client = TelemetryStore.shared.client else { return }
                switch event {
                case .signedIn(let userId):
                    var context = context
                    context = TelemetryContext(
                        platform: context.platform,
                        env: context.env,
                        appVersion: context.appVersion,
                        buildNumber: context.buildNumber,
                        userId: userId,
                        isSignedIn: true,
                        sessionId: context.sessionId,
                        traceId: context.traceId,
                        spanId: context.spanId,
                        requestId: context.requestId
                    )
                    await client.capture(.authSignedIn, properties: [:], context: context)
                    await client.logWideEvent(.authSignedIn, properties: [:], context: context)
                case .signedOut(let userId):
                    var context = context
                    context = TelemetryContext(
                        platform: context.platform,
                        env: context.env,
                        appVersion: context.appVersion,
                        buildNumber: context.buildNumber,
                        userId: userId,
                        isSignedIn: false,
                        sessionId: context.sessionId,
                        traceId: context.traceId,
                        spanId: context.spanId,
                        requestId: context.requestId
                    )
                    await client.capture(.authSignedOut, properties: [:], context: context)
                    await client.logWideEvent(.authSignedOut, properties: [:], context: context)
                }
            }
        )
    }
}
