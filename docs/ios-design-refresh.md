# iOS design refresh

The native dashboard shares the web app's paper, ink, and red palette while keeping SwiftUI navigation, sheets, and tabs.

- Challenge cards show a prominent total, target, progress bar, pace, and eight weeks of activity. The activity chart includes the current week and leaves future days blank.
- A separate, full-width **Log progress** button opens the existing entry sheet. Future and archived challenges do not offer logging from their card.
- An empty account has one introduction and one create action. Empty analytics panels are hidden until a challenge exists.
- Cached days remaining and pace are recalculated from today when creating, editing, logging, or returning offline, using the API's five-percent pace tolerance.
- Calendar dates stay in the local time zone when creating or editing goals, including monthly boundaries.
- New challenges offer optional reading, movement, and practice ideas. These prefill editable monthly goals; the user still presses Create to save.
- Pull to refresh belongs to the Home scroll view. The date and weekly review link sit above the configurable panels.
- Card titles wrap, totals scale, and status/activity can stack. Highlights switch to one column at accessibility text sizes.

## Verification

Generate the workspace with `cd ios && tuist install && tuist generate --no-open`. Use an available simulator ID from `xcrun simctl list devices available`:

```sh
xcodebuild test -workspace Tally.xcworkspace -scheme TallyFeatureChallenges -destination 'platform=iOS Simulator,id=SIMULATOR_ID' CODE_SIGNING_ALLOWED=NO
xcodebuild test -workspace Tally.xcworkspace -scheme App -destination 'platform=iOS Simulator,id=SIMULATOR_ID' -only-testing:AppUITests/DesignRefreshTests CODE_SIGNING_ALLOWED=NO
```

`RecentActivityTests` covers today's entries, aggregation, future cells, local dates and daylight-saving boundaries. `DesignRefreshTests` creates a reading goal, logs 25, checks the displayed total, and relaunches to verify persistence.

The iOS E2E workflow selects an installed iPhone instead of assuming iPhone 15 exists. Unit and UI failures now fail the job; screenshot tests attach images to the result bundle instead of writing to a developer-specific path.
