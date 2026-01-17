## Tally iOS Scaffold

This directory hosts the Tuist + SwiftUI foundation for the native app.

### Structure

- `Workspace.swift` & `Tuist/` — Workspace + global Tuist config (Xcode 15.4 / Swift 5.9).
- `App/` — App target (`TallyApp`), SwiftUI shell, and resource catalog.
- `Packages/TallyCore` — Shared domain types (e.g., `User`, `AuthClient`, `SyncStatus`).
- `Packages/TallyFeatureAuth` — SwiftUI surfaces for auth-ready shell, background texture, and signed-in placeholder.

### Usage

```bash
cd ios
tuist install # if needed
tuist generate
```

Then open `Tally.xcworkspace` and run the `Tally` scheme.

### Design alignment

- Visual motif uses subdued tally marks with a warm red slash accent.
- Auth shell communicates offline-first calm copy with large tap targets.
- Reduced-motion friendly animations and high-contrast palette.
