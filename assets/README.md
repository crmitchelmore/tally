# Tally brand assets

The five-stroke mark uses ivory and coral on indigo. `icons/source/mark.svg` is the precise geometry shared by every export. `icons/source/tally-colour.png` preserves the Image Gen colour reference; production exports use deterministic geometry to keep edges clean at every density.

## Regenerate and verify

After installing dependencies in `tally-web`, run from the repository root:

```sh
node scripts/generate-icons.cjs
node scripts/verify-icons.cjs
```

The generator creates:

- Web SVG, 16/32/48px favicons and multi-size ICO, 180px Apple touch icon, 192/512px PWA icons and a separate maskable declaration.
- iOS/iPadOS 1024px light, dark and tinted catalog variants. Light is opaque and square; dark provides the foreground with alpha; tinted is opaque grayscale. The OS applies its own icon shape.
- Android foreground vector and full-bleed background, adaptive and monochrome declarations, and legacy regular/round icons at all five densities. The foreground fits within the 66dp safe circle of a 108dp layer.

The verifier checks dimensions, default opacity, exact web/native parity, grayscale values, required appearances and mask safety. `icons/preview.html` shows representative sizes and launcher masks. App icons intentionally contain no baked-in outer shadow.

Colours: indigo `#4F46E5`, ivory `#FFF9F2`, coral `#FF947E`. The indigo field runs from `#6255EE` to `#3730A3`. Keep the diagonal rising from left to right.

## Image generation provenance

Built-in Image Gen created the retained reference. Brief: a centred five-stroke tally mark, four evenly spaced ivory vertical pills crossed by one coral rising diagonal, clean geometric edges, on a full-bleed indigo field; no text, shadow, border or pre-rounded corners. Transparent generation trials were discarded because of edge artefacts. Platform-native geometry recreates the selected colour design.

Do not use the reference PNG as an adaptive foreground: it includes a background. Update `mark.svg` and the matching Android vector geometry together if the mark changes.
