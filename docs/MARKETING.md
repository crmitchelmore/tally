# Marketing + App Store Assets

This folder contains **source assets** and ready-to-use copy for Tally marketing.

## Quick Links

- [App Store Copy](./app-store-copy.md) — Ready-to-use listing copy for iOS and Android
- [Marketing Assets Guide](./MARKETING-ASSETS.md) — How to capture screenshots, videos, and create demos
- [Design Philosophy](./DESIGN-PHILOSOPHY.md) — Brand guidelines and motion principles

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

## Videos & Screenshots

See `docs/MARKETING-ASSETS.md` for the complete guide on:
- Recording screen captures on iOS, Android, and Web
- Video dimensions and formats for each platform
- Key flows to capture for marketing
- Post-processing and optimization
- Landing page video integration

### Video Asset Location

Videos and images for the landing page go in:
```
tally-web/public/
├── videos/           # Demo videos (mp4, webm)
├── images/
│   ├── posters/      # Video poster images
│   └── screenshots/  # Platform screenshots
│       ├── ios/
│       ├── android/
│       └── web/
```

## Landing Page Components

The web app includes marketing components for showcasing the mobile apps:

```tsx
import { 
  PhoneFrame,           // Device mockup frame
  VideoShowcase,        // Autoplay video with scroll detection
  FeatureShowcase,      // Text + video/image side by side
  AppShowcase,          // iOS + Android phone showcase section
  AnimatedCounter,      // Smooth number animations
} from "@/components/marketing";
```

See component files in `tally-web/src/components/marketing/` for usage.
