# Marketing + App Store Assets

This folder contains **source assets** and ready-to-use copy for Tally marketing.

## Icons

- `docs/brand-app-icon.svg` — **App icon source** (1024×1024), suitable as the master file for exporting iOS/Android icon sets.
- `docs/brand-glyph.svg` — **Monochrome glyph** (24×24) for tab bars, nav, and small UI.

### Export specs (quick)

**iOS App Icon (App Store):** export **1024×1024 PNG** from `brand-app-icon.svg` as the source; Xcode will generate the rest when you drop the 1024 into `AppIcon`.

**Android Adaptive Icon:** export:
- Foreground: the tally marks only (transparent background)
- Background: solid `#FDE047` (or the gradient baked in, if you prefer a single-layer look)

Recommended outputs:
- `ic_launcher.png` 512×512 (Play Console)
- `mipmap-*` sizes via Android Studio asset generator

**Web:** Next.js will use `tally-web/src/app/icon.svg` automatically.

## App store listing copy

See `docs/app-store-copy.md`.
