# Marketing Assets & Video Capture Guide

This guide covers how to capture screenshots, videos, and animated demos for Tally's marketing materials.

## Asset Dimensions

### App Store Screenshots

| Platform | Size | Format |
|----------|------|--------|
| iOS App Store | 1290×2796 (6.7"), 1242×2688 (6.5"), 1284×2778 (6.1") | PNG |
| Google Play | 1080×1920 (phone), 7" tablet, 10" tablet | PNG/JPEG |
| Web OG image | 1200×630 | PNG |

### Video Specs

| Platform | Resolution | Duration | Format |
|----------|------------|----------|--------|
| App Store Preview | 1080×1920 or 1920×1080 | 15-30s | MP4/MOV |
| Google Play | 1920×1080 | 30s-2min | MP4 |
| Landing page | 720p-1080p | 5-15s loops | MP4/WebM |
| Social (Twitter/X) | 1200×675 | 15-60s | MP4 |
| Social (Instagram) | 1080×1080 or 1080×1920 | 15-60s | MP4 |

## Recording Tools

### macOS

```bash
# Screen recording
# Use Cmd+Shift+5 for built-in screen recording

# Or use ffmpeg for terminal recording
brew install ffmpeg

# Record screen area (replace coordinates)
ffmpeg -f avfoundation -capture_cursor 1 -i "1" -t 15 -r 30 output.mp4
```

### iOS Simulator Recording

```bash
# Record simulator screen
xcrun simctl io booted recordVideo demo.mov

# Stop recording with Ctrl+C

# Convert to optimized MP4
ffmpeg -i demo.mov -vcodec h264 -acodec aac demo.mp4
```

### Android Emulator Recording

```bash
# Record via ADB
adb shell screenrecord /sdcard/demo.mp4 --time-limit 30

# Pull the file
adb pull /sdcard/demo.mp4
```

### Web Screenshot Tools

```bash
# Using Playwright (already in project)
cd tally-web
bun run test:e2e:ui  # Updates visual snapshots

# Or use Chrome DevTools:
# 1. Open DevTools (Cmd+Option+I)
# 2. Cmd+Shift+P → "Capture screenshot" or "Capture full size screenshot"
# 3. For device frames: Toggle Device Toolbar (Cmd+Shift+M)
```

## Key Flows to Capture

### 1. Quick Add Flow (5-10s loop)
**Story:** Show how fast it is to add a tally
- Open app → tap +1 → see count update with animation → confetti on milestone

### 2. Challenge Creation (10-15s)
**Story:** Creating a new challenge is effortless
- Tap "New Challenge" → type name → set target → save → see it in list

### 3. Progress Visualization (10-15s)
**Story:** Watch your progress build over time
- Show chart with data filling in → zoom to streak → highlight best day

### 4. Cross-Platform Sync (15-20s)
**Story:** Your progress everywhere
- Add entry on phone → see it appear on web instantly

### 5. Community Discovery (10-15s)
**Story:** Find inspiration from others
- Browse community → tap to view → follow challenge

## Video Post-Processing

### Optimize for Web

```bash
# Convert to web-optimized MP4
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -movflags +faststart output.mp4

# Create WebM version (better compression)
ffmpeg -i input.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm

# Create poster image (first frame)
ffmpeg -i input.mp4 -vframes 1 -q:v 2 poster.jpg
```

### Create GIF (for fallback)

```bash
# High-quality GIF with palette optimization
ffmpeg -i input.mp4 -vf "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif
```

### Add Phone Frame Overlay

The `PhoneFrame` component in the web app renders device mockups client-side. For static images/videos:

1. Export the video/screenshot raw (no frame)
2. Use Figma/Sketch to place in device frame
3. Or use online tools like mockuphone.com

## Landing Page Video Integration

Videos are displayed using the `VideoShowcase` component:

```tsx
import { VideoShowcase, FeatureShowcase } from "@/components/marketing";

// Inline looping video
<VideoShowcase
  src="/videos/quick-add-demo.mp4"
  poster="/images/quick-add-poster.jpg"
  alt="Quick add demonstration"
  aspectRatio="16/9"
  loop
  autoPlay
/>

// Feature section with video
<FeatureShowcase
  videoSrc="/videos/progress-chart.mp4"
  title="Watch momentum build"
  description="Beautiful charts show your consistency over time."
/>
```

## File Organization

```
tally-web/public/
├── videos/
│   ├── quick-add-demo.mp4
│   ├── quick-add-demo.webm
│   ├── progress-chart.mp4
│   ├── community-browse.mp4
│   └── cross-platform-sync.mp4
├── images/
│   ├── posters/
│   │   ├── quick-add-poster.jpg
│   │   └── progress-poster.jpg
│   └── screenshots/
│       ├── ios/
│       ├── android/
│       └── web/
```

## Checklist Before Recording

- [ ] Use clean test data (reset to demo state)
- [ ] Hide personal info / real user data
- [ ] Enable "Do Not Disturb" (no notifications)
- [ ] Use consistent device/browser settings
- [ ] Check lighting if physical device
- [ ] Test animations are smooth (no dropped frames)
- [ ] Respect accessibility: ensure content is understandable without sound

## Accessibility Notes

- All videos should have `muted` by default (autoplay requirement)
- Provide text descriptions of what's shown
- Consider providing transcript or captions for longer videos
- Ensure poster images have alt text
- Honor `prefers-reduced-motion` - don't force autoplay

## Animation Guidelines

Reference `docs/DESIGN-PHILOSOPHY.md` for motion principles:

- **Duration:** 120-220ms for UI interactions, 280-420ms for hero moments
- **Easing:** `ease-out` for entries, `ease-in-out` for transitions
- **Scale:** Keep scale changes subtle (0.95-1.05)
- **Colors:** Use brand palette (see CSS custom properties)

## Tools Summary

| Task | Tool |
|------|------|
| Screen recording (macOS) | QuickTime, OBS, or ffmpeg |
| iOS recording | Simulator + xcrun simctl |
| Android recording | adb screenrecord |
| Video editing | iMovie, Final Cut, DaVinci Resolve |
| GIF creation | ffmpeg, Gifski, EZGIF |
| Device frames | Figma, Rotato, mockuphone.com |
| Image optimization | squoosh.app, ImageOptim |
| Video compression | HandBrake, ffmpeg |
