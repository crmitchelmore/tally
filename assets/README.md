# Tally Brand Assets

This directory contains the canonical brand assets for the Tally app, shared across all platforms.

## Directory Structure

```
assets/
└── icons/
    ├── icon-1024.png      # Master icon (source of truth)
    ├── icon-512.png       # PWA icon
    ├── icon-192.png       # PWA icon
    ├── apple-touch-icon.png  # iOS web clip (180x180)
    ├── favicon-32x32.png  # Browser tab
    ├── favicon-16x16.png  # Browser tab
    └── favicon.ico        # Legacy browsers
```

## Regenerating Icons

From the master 1024px icon, regenerate all sizes:

```bash
cd assets/icons
magick icon-1024.png -resize 512x512 icon-512.png
magick icon-1024.png -resize 192x192 icon-192.png
magick icon-1024.png -resize 180x180 apple-touch-icon.png
magick icon-1024.png -resize 32x32 favicon-32x32.png
magick icon-1024.png -resize 16x16 favicon-16x16.png
magick favicon-16x16.png favicon-32x32.png favicon.ico
```

## Platform Usage

- **Web**: Copy icons to `tally-web/public/`
- **iOS**: Copy `icon-1024.png` to `ios/App/Resources/Assets.xcassets/AppIcon.appiconset/`
- **Android**: Use Android Studio to generate adaptive icons from `icon-1024.png`

## Brand Colors

- Background: `#FAF8F5` (warm off-white)
- Tally marks: `#3D3D3D` (dark charcoal)
