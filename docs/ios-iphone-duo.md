# iPhone Duo layout and verification

The compact layout opens on the challenge list. Each simple-count challenge has a direct **+1** action. The entry editor remains available for dates, notes, and other amounts. Set-based challenges open the editor directly. Future and archived challenges have no direct **+1** action.

At regular widths, the native split view keeps the challenge list alongside the dashboard or the selected challenge. The detail pane groups progress and history and keeps logging available below the scrollable content. Navigation and sheets use the system safe areas. Settings and the entry composer are presented from the app or Home root so a change in the split view's presentation does not create a new draft. The native split view manages which pane stays visible as the window resizes.

The implementation targets iOS 17. Apple requires the iOS 27.1 SDK or later for both displays to extend edge to edge with vertical bars. Apple also recommends testing reserved regions in the iPhone Duo simulator. [Preparation guide](https://developer.apple.com/iphone-duo/prepare/) · [Design guidelines](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)

## Bravo verification

- Xcode 26.2 (17C52) has the iOS 26.2 SDK and the Mac has an iOS 26.3 runtime. No iOS 27.1-or-later SDK or iPhone Duo simulator was found.
- Tuist installed dependencies and generated the workspace. Xcode reported iOS 17.0 deployment with iPhone and iPad device families. The changed Swift files parsed and the SwiftUI layout APIs type-checked against the installed SDK with an iOS 17 deployment target.
- A standalone harness used the production challenge manager and stores with an offline API stub, then with a delayed fake server. Three offline increments produced three unique records and a persisted total of three after recreating the stores and manager. Four taps spanning an in-flight request produced four server creates and a local total of four.
- Bravo's storage guard refused the baseline and app builds. It reported 79.6–79.7 GiB free on the external volume against a 90 GiB admission requirement. A cleanup preview found about 3.6 GiB of eligible output. App UI tests and before/after screenshots remain pending.

## Remaining verification

Once Bravo admits the build, generate the workspace with `tuist install && tuist generate --no-open` from `ios/`. Run the `App` scheme's `DesignRefreshTests`, `EntryTests`, `ChallengeTests`, `OfflineTests` and `StoreScreenshotTests` on dedicated ordinary iPhone and iPad simulators with the app's offline entry point. Inspect the signed-out and account Settings paths too. Capture matching baseline and updated layouts using the same fictional goal and progress. Test the iPad with a narrow app window and repeat with the largest accessibility text size. Check VoiceOver traversal of challenge, increment, and entry editor actions.

On a host with Xcode and the iOS 27.1 SDK or later, use Device Hub to fold and unfold iPhone Duo in both orientations. Check the system's vertical bars, status area, camera cutout, hinge and split-view column widths in supported poses. Check an open keyboard, unsaved add and edit forms, visible history and charts, and Settings as the display changes. Repeat rapid increments during the move, verify the exact history and total after offline relaunch and then validate sync with a test account. Release readiness requires those device checks.
