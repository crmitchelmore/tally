import SwiftUI
import TallyFeatureAuth
import TallyFeatureChallenges

struct RootView: View {
    @ObservedObject var state: AppState

    var body: some View {
        ZStack {
            BackgroundTexture()
            Group {
                switch state.route {
                case .launch:
                    LaunchView()
                        .task {
                            await state.bootstrap()
                        }
                case .signedOut:
                    AuthShell(
                        onSignIn: state.completeAuth,
                        errorMessage: state.authErrorMessage
                    )
                case .signedIn:
                    if let store = state.challengesStore {
                        ChallengesView(
                            store: store,
                            onSignOut: state.signOut
                        )
                    } else if case .signedIn(let user) = state.route {
                        SignedInView(
                            user: user,
                            onSignOut: state.signOut
                        )
                    }
                }
            }
            .animation(.easeOut(duration: 0.2), value: state.route)
        }
    }
}

struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView(state: AppState(route: .signedOut))
    }
}
