# NosePrint — Complete Project Prompt

Build a cross-platform app called **NosePrint** that turns a photo of a dog's nose into tattoo-ready line art.

## 1. Goal
A user takes or uploads a photo of their dog's nose. The app extracts the unique nose pattern (ridges and creases) and converts it into a clean tattoo design they can save, share, or give to a tattoo artist.

## 2. Hard requirements
- **Platforms:** Web, Android, and iOS from ONE codebase.
- **No login, no accounts, no subscription, no payments, no ads.**
- **Fully offline:** all image processing runs on the device. No backend server and no external APIs.
- **Privacy:** photos never leave the device unless the user shares them.
- **Free to use anywhere.**

## 3. Tech stack
- **Expo (latest SDK) + React Native + TypeScript**
- **Expo Router** for navigation
- **@shopify/react-native-skia** for image loading, pixel access, preview rendering, and export (works on iOS, Android, and web)
- **expo-image-picker:** camera and gallery
- **expo-image-manipulator** (or a Skia-based crop) for cropping and resizing
- **expo-media-library:** save to the phone gallery
- **expo-sharing:** share sheet (on web, fall back to a file download)
- **@react-native-async-storage/async-storage** + **expo-file-system:** local storage of saved designs
- A **pure TypeScript** image-processing module (no OpenCV) so the same algorithm runs on every platform
- A JS port of **Potrace** for SVG vector export
- Builds: **EAS Build** for Android/iOS, `npx expo export --platform web` for web

## 4. User flow / screens
1. **Home**
   - App logo and a short tagline
   - "Take Photo" and "Choose from Gallery" buttons
   - "My Designs" button
2. **Crop**
   - Crop the photo to the nose (square or circle)
   - Tips overlay: good lighting, close-up, nose in focus
3. **Editor** (main screen)
   - Live preview of the tattoo line art
   - Style selector:
     - **Fineline:** thin clean outlines
     - **Bold / Blackwork:** thick, filled pattern
     - **Stencil:** high-contrast outline for tattoo artists
     - **Dotwork:** pattern rendered as dots
   - Sliders: Detail (threshold), Line thickness, Smoothness (blur), Contrast
   - Toggle: invert colors
   - Frame options: none, heart, paw, circle
   - Optional text: dog name and date, with a font choice and position
   - Before/after compare toggle
4. **Export**
   - Save as **PNG** (high resolution, transparent background option)
   - Save as **SVG** (vector, for tattoo artists)
   - Share via the system share sheet (download on web)
   - Save to "My Designs"
5. **My Designs**
   - Grid of saved designs stored locally
   - Open to re-edit, share, or delete
6. **About / Help**
   - How to take a good nose photo
   - Privacy note: everything stays on your device

## 5. Image-processing pipeline (pure TypeScript, `src/processing/`)
Input: an RGBA pixel array from Skia. Output: an RGBA pixel array or SVG paths.
1. Resize the working image to at most 1024 px for speed. Render the full-resolution version only on export.
2. Convert to grayscale.
3. Contrast enhancement (CLAHE or histogram equalization).
4. Gaussian blur (radius from the Smoothness slider).
5. Adaptive threshold (mean or Gaussian, block size and constant from the Detail slider). This isolates the nose creases.
6. Morphological clean-up: remove small specks (opening) and close gaps (closing).
7. Style step:
   - Fineline: skeletonize/thin, then dilate to the chosen thickness
   - Bold: keep filled regions, dilate
   - Stencil: edge outline only (Sobel/Canny-like)
   - Dotwork: sample the mask on a grid and draw dots
8. Apply the frame mask and text overlay (with Skia).
9. Vector export: run Potrace on the binary mask, then output an SVG.
- Run heavy steps off the UI thread where possible (Web Worker on web; chunked or async processing on native). Debounce slider changes (~150 ms).

## 6. Project structure
```
app/                 # Expo Router screens
  index.tsx          # Home
  crop.tsx
  editor.tsx
  export.tsx
  designs.tsx
  about.tsx
src/
  processing/        # pure TS image pipeline (+ unit tests)
  components/        # sliders, style picker, frame picker, preview
  storage/           # saved designs (AsyncStorage + FileSystem; IndexedDB on web)
  theme/             # colors, fonts, light/dark mode
assets/              # logo, frames (heart, paw, circle) as SVG
```

## 7. Design / UI
- Clean, modern, friendly look (dog theme, but minimal)
- Light and dark mode
- Large touch targets; responsive layout for phones, tablets, and desktop browsers
- Smooth live preview while sliders move

## 8. Quality
- TypeScript strict mode
- Unit tests (Jest) for the processing functions
- Handle errors: denied permissions, too-small images, low-contrast photos (show tips)
- Works with no internet connection

## 9. Deliverables
1. A working Expo project that runs with `npx expo start` (web, Android via Expo Go, iOS via Expo Go)
2. README with setup, run, and build instructions (EAS for stores, static web export)
3. Build in phases:
   - **Phase 1 (MVP):** pick photo → crop → Fineline style with sliders → save PNG
   - **Phase 2:** all styles, frames, text, SVG export
   - **Phase 3:** My Designs gallery, share, polish, app icon, splash screen, store builds
