// Deployment settings.

/**
 * Prefix for files in public/ (e.g. "/NosePrint" on GitHub Pages, from app.json experiments.baseUrl).
 * The dev server serves public/ from the root, so it is empty in development.
 */
export const BASE_URL = __DEV__ ? '' : (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');

/**
 * Android APK download link shown on the web Home screen.
 * Points at the latest GitHub Release asset named "noseprint.apk"; override with EXPO_PUBLIC_APK_URL.
 */
export const APK_URL =
  process.env.EXPO_PUBLIC_APK_URL || 'https://github.com/charlespura/NosePrint/releases/latest/download/noseprint.apk';

export const REPO_URL = 'https://github.com/charlespura/NosePrint';
