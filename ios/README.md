# Tally iOS App

iOS implementation of Tally using SwiftUI, Tuist, Clerk auth, and the Fractal Completion Tallies design system. Uses the shared REST API (Convex-backed on web).

## Quick Start

### Prerequisites
- Xcode 26.2+ (iOS 17.0+ support)
- Tuist 4.125.0+

### Build & Run

```bash
cd ios
tuist generate
open Tally.xcworkspace
# Build and run in Xcode (⌘R)
```

Or via command line:

```bash
cd ios
tuist generate
xcodebuild -workspace Tally.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  build
```

## Project Structure

```
ios/
├── Workspace.swift              # Tuist workspace definition
├── App/
│   ├── Project.swift            # Main app target + build settings
│   ├── Sources/
│   │   ├── TallyApp.swift       # App entry point
│   │   ├── AppView.swift        # Root TabView
│   │   ├── HomeView.swift       # Challenges dashboard
│   │   ├── CommunityView.swift  # Community (public challenges)
│   │   ├── SettingsView.swift   # Export/import + tip jar
│   │   └── SyncStatusView.swift # Offline/sync indicator
│   └── Tests/
│       └── AppTests.swift
└── Packages/
    ├── TallyCore/               # Shared models + config + keychain
    ├── TallyDesign/             # Design system (colors, typography, tallies)
    ├── TallyFeatureAuth/        # Clerk auth + token refresh
    ├── TallyFeatureAPIClient/   # REST API client (Bearer)
    ├── TallyFeatureChallenges/  # Offline-first challenges + entries
    └── TallyFeatureTipJar/      # StoreKit tip jar
```

## Design System

### TallyDesign Package

A SwiftUI design system package containing:

#### Color Tokens
- **tallyPaper:** Off-white background (light) / dark gray (dark)
- **tallyInk:** Primary foreground (C1)
- **tallyInkSecondary:** Mid-level detail (C2)
- **tallyInkTertiary:** Subtle elements (C3)
- **tallyAccent:** Warm red for 5th tally slash
- **Semantic:** tallySuccess, tallyWarning, tallyError

#### Typography
- **Display:** Large numbers (56pt, 40pt, 32pt)
- **Title:** Headings (28pt, 22pt, 20pt)
- **Body:** Content text (17pt, 15pt, 13pt)
- **Label:** Metadata (15pt, 13pt, 11pt)
- **Monospaced:** Numbers (40pt, 17pt)

#### Spacing Scale
- xs: 4pt, sm: 8pt, md: 12pt, **base: 16pt**, lg: 24pt, xl: 32pt, xxl: 48pt, xxxl: 64pt

#### Motion
- **quick:** 120ms (micro-interactions)
- **standard:** 220ms (UI transitions)
- **deliberate:** 350ms (important moments)
- **hero:** 420ms (onboarding)
- **strokeDraw/slashDraw:** Tally-specific animations

### TallyMarkView Component

**FRACTAL_COMPLETION_TALLIES** - Hierarchical tally visualization that collapses detail at exact thresholds.

```swift
import TallyDesign

TallyMarkView(count: 25, animated: true, size: 120)
```

**Rendering Logic:**
- **1-4:** Vertical strokes
- **5:** 5-gate (4 strokes + diagonal slash)
- **6-24:** X layout (5 positions)
- **25:** ✨ 25-cap with X overlay (C2)
- **26-99:** 2x2 grid of 25-units
- **100:** ✨ Collapsed to X + square (C2 + C3)
- **101-999:** Row of 100-blocks
- **1000:** ✨ 10 squares + horizontal line
- **1001-9999:** Stack of rows
- **10,000:** ✨ Diagonal closure stroke

**Accessibility:**
- VoiceOver labels
- Reduce Motion support
- Dynamic Type compatible

## App Architecture

### Navigation
- **TabView:** Home, Community
- **NavigationStack:** Detail navigation (iOS 17+ pattern)
- **Modal sheets:** Settings, creation flows

### State Management
- SwiftUI `@State` for local UI
- `@Observable` for shared state (Swift 5.9+)
- Offline-first caching via `LocalChallengeStore` + `LocalEntryStore`

### Sync Strategy
- Offline-first: local writes succeed immediately; pending changes sync when online
- `ChallengesManager` refreshes from API and merges cached data
- SyncStatusView shows queue state

### Authentication
- Clerk SDK for iOS with token stored in Keychain
- AuthManager provisions users via `POST /api/v1/auth/user`
- Supports local-only/offline mode (user selectable)

### API
- `TallyFeatureAPIClient` uses Bearer auth and REST API routes under `/api/v1`
- Default API base URL: `https://tally-tracker.app` (override via `API_BASE_URL`)

### Tip Jar
- StoreKit 2 tip jar (`TallyFeatureTipJar`) exposed in Settings

### Known API mismatches (audit)
- None currently. iOS API client aligns with `/api/v1/stats`, `/api/v1/follow`, `/api/v1/followed`, and `/api/v1/data`.

## Design Philosophy

**Tactile, Focused, Honest**

- ✅ **No emoji/confetti** - ink strokes only
- ✅ **Platform-native** - SwiftUI, SF Symbols, system fonts
- ✅ **Reduce Motion** - respects accessibility settings
- ✅ **VoiceOver** - meaningful labels throughout
- ✅ **Dynamic Type** - scales to accessibility sizes
- ✅ **Light/Dark** - automatic appearance adaptation

## Development

### Adding Features

1. Update `plans/ios/feature-*.md` with requirements
2. Implement in `App/Sources/` or `Packages/TallyDesign/`
3. Add tests in `Tests/`
4. Run `tuist generate` if project structure changed
5. Build and verify

### Running Tests

```bash
cd ios
tuist generate
xcodebuild test \
  -workspace Tally.xcworkspace \
  -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 17'
```

### Code Style

- SwiftUI preferred over UIKit
- `@Observable` over `@ObservableObject`
- NavigationStack over NavigationView
- Canvas for custom drawing
- Composition over inheritance

## Next Steps

- [ ] Snapshot tests for TallyMarkView thresholds
- [ ] Settings screen with theme toggle
- [ ] Persist settings + user prefs server-side (in progress via /api/v1/auth/user/preferences)
- [ ] Improve sync conflict resolution
- [ ] Detail navigation flows
- [ ] Dynamic Type testing
- [ ] VoiceOver audit

## Resources

- [Tuist Documentation](https://docs.tuist.io)
- [SwiftUI Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/swiftui)
- [Accessibility Best Practices](https://developer.apple.com/accessibility/)
- [Design Philosophy](../DESIGN-PHILOSOPHY.md)
- [Feature Plans](../plans/ios/)

---

**Status:** ✅ Foundation Complete  
**Build:** Xcode 26.2, iOS 17.0+  
**Last Updated:** 2026-01-20
