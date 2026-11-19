// Deployment settings.

/** Sub-path the web app is served from (e.g. "/NosePrint" on GitHub Pages). Set via app.json experiments.baseUrl. */
export const BASE_URL = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');

/**
 * Android APK download link shown on the web Home screen.
 * Points at the latest GitHub Release asset named "noseprint.apk"; override with EXPO_PUBLIC_APK_URL.
 */
export const APK_URL =
  process.env.EXPO_PUBLIC_APK_URL || 'https://github.com/charlespura/NosePrint/releases/latest/download/noseprint.apk';

export const REPO_URL = 'https://github.com/charlespura/NosePrint';
