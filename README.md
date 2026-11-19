# NosePrint 🐾

Turn a photo of your dog's nose into tattoo-ready line art. Web, Android and iOS from one Expo codebase.
No accounts, no ads, no servers: all processing runs on the device.

**Features:** 5 styles (Sketch, Fineline, Stencil, Dotwork, Bold) · presets · undo/redo · eraser · ink colours · frames (circle, heart, paw) · name/date text in 3 fonts · real-size preview · PNG + SVG export · share · My Designs gallery · light/dark mode.

## Requirements
- Node.js 18+ (tested on 24)
- For phones: the **Expo Go** app (Android / iOS)

## Run
```bash
npm install
npx expo start          # press w for web, or scan the QR code with Expo Go
```

## Test / check
```bash
npm test                # Jest unit tests for src/processing
npm run typecheck       # TypeScript strict
npx expo-doctor
```

## Build
**Web (static, works offline once loaded):**
```bash
npx expo export --platform web   # output in dist/, host it on any static host
```
`public/canvaskit.wasm` (Skia for web) is copied into the build. If you upgrade Skia, re-run `npx setup-skia-web public`.

**Android / iOS store builds (EAS):**
```bash
npx eas-cli@latest login         # free Expo account
npx eas-cli@latest build:configure
npx eas-cli@latest build -p android --profile preview      # installable APK
npx eas-cli@latest build -p android --profile production   # Play Store AAB
npx eas-cli@latest build -p ios --profile production       # needs an Apple Developer account
```
Bundle ID / package: `com.noseprint.app` (set in `app.json`).

## Web landing page & demo
On web, `/` shows a landing page (`app/index.web.tsx`) with an interactive photo→tattoo slider and a clickable, step-by-step demo. The app itself is at `/start`; phones open the app directly.
- Demo images in `public/demo/` were rendered by the real pipeline.
- Optional narration: record `public/demo/voice/step-1.mp3` … `step-5.mp3`. Script and recording tips are in [docs/demo-narration.md](docs/demo-narration.md).
- Freeze a demo frame for screenshots: `/?demo=<0-4>&t=<ms>`.

## Let web visitors download the Android APK
The Home screen (web only) shows **"Download Android app (APK)"** when an APK is available:
1. Build it: `npx eas-cli@latest build -p android --profile preview` and download the `.apk` from the link EAS prints.
2. Either copy it to `public/noseprint.apk` (it's then served at `/noseprint.apk` and included in `npx expo export`),
   **or** host it elsewhere (GitHub Releases, Google Drive direct link…) and set `EXPO_PUBLIC_APK_URL=https://…/noseprint.apk` in a `.env` file before exporting.
3. Re-export the web build. The button appears automatically; if no APK is found it stays hidden.

## Regenerate icons
`node scripts/make-icons.js` redraws `assets/icon.png`, Android adaptive icons, splash and favicon.

## Project layout
```
app/                 Expo Router screens (index, crop, editor, export, designs, about)
src/processing/      pure-TS image pipeline + Jest tests
src/skia/            Skia decode/encode (lazy-loaded; CanvasKit on web)
src/components/      UI building blocks
src/storage/         gallery save, share, My Designs (files on native, IndexedDB on web)
src/state/           in-memory hand-off between screens
src/theme/           colors, light/dark mode
```

## Pipeline (src/processing)
grayscale → histogram equalization (Contrast) → Gaussian blur (Smoothness) → mean adaptive threshold (Detail)
→ opening + speck removal + closing → Zhang–Suen thinning → dilate (Line thickness) → circle mask.
The preview runs at 512 px, debounced 150 ms. Export re-runs it at full crop resolution (up to 2048 px).

## Not done yet
- Heavy processing still runs on the main thread (a short pause on full-resolution export on older phones). Moving it to a Web Worker / background thread is the next performance step.
