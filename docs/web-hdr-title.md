# Decision: a restrained HDR title accent (web only)

The existing 28px header word “tally”, and only that word, can use genuine
HDR on a dark theme. The tally-mark artwork, footer, large hero headings,
paragraphs, colours, font, layout, native apps and API are unchanged.

## Mechanism and graceful degradation

A local JPEG with an ISO 21496-1 gain map supplies up to 1.5× SDR reference
white, clipped to the existing text. No CSS brightness, glow, animation,
JavaScript, external image service or image-optimisation pipeline is used.
`dynamic-range: high` is a display capability hint, **not** proof that a browser
can decode or composite gain maps in CSS backgrounds. The enhancement also
requires `background-clip: text`, screen media, `.dark` (the existing resolved
app theme), and no forced colours. It does not initialise or change the theme.

Ordinary light and SDR rendering retains the existing real ink colour. A
browser that ignores the gain map renders the JPEG's SDR white; a failed
request still has the original near-white ink as its clipped background colour.
Printing and forced colours restore solid text; selection uses system highlight
colours and explicit text fill. There is no motion, including reduced-motion
mode. Do not infer genuine HDR output from a screenshot or CSS feature query.

## Asset provenance and reproduction

`/hdr/white-1.5x.jpg` is a self-authored 64×64 uniform white SDR base and uniform
white gain-map JPEG, authored locally for this work (no third-party artwork).
The shared source asset is `/tmp/hdr-accent-assets/white-1.5x.jpg`.
SHA-256: `511edb2c416eb20f902d7b6c5015063ee1169ea9b34c085e02b07a9cc5406d32`.

Packaged using Google's libultrahdr, commit
`66821e0a261aa3a06c0e7c889f52eced52850be1`, encoding scenario 4:

```sh
ultrahdr_app -m 0 -i white-sdr.jpg -g gain-white.jpg -f metadata.cfg -z white-1.5x.jpg
```

Metadata configuration (RGB triplets, linear boost ratios):

```text
--maxContentBoost 1.5 1.5 1.5
--minContentBoost 1.0 1.0 1.0
--gamma 1.0 1.0 1.0
--offsetSdr 0.0 0.0 0.0
--offsetHdr 0.0 0.0 0.0
--hdrCapacityMin 1.0
--hdrCapacityMax 1.5
--useBaseColorSpace 1
```

Independent verification of the committed asset with `ultrahdr_app -m 1 -j
white-1.5x.jpg -P` identified an Ultra HDR image and the above metadata.
Decoding with `-o 0 -O 4` produced 4096 RGBA half-float pixels, every RGB channel
exactly **1.5** in linear light: real above-reference-white content, not an
SDR styling imitation. The binary includes the ISO 21496-1 namespace.

Unit tests pin these verified bytes and CSS/markup scope. Browser regression
tests cover SDR/light, dark ink, clipping, reduced motion, print and forced
colours; they deliberately force only the media gate to test CSS plumbing.
**Physical HDR brightness and browser HDR compositing have not been verified on
an HDR display.** A real HDR-capable browser/display, adequate headroom and
successful gain-map decoding/compositing are still necessary for the accent.
