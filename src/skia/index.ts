import { Platform } from 'react-native';
import type * as IO from './imageIO';
import { BASE_URL } from '../config';

let ioPromise: Promise<typeof IO> | null = null;

/**
 * Loads Skia lazily. On web, CanvasKit (WASM, served from /canvaskit.wasm) must be
 * initialised before `@shopify/react-native-skia` is evaluated, so imageIO is
 * imported dynamically afterwards. Works offline once the app is cached.
 */
export function getImageIO(): Promise<typeof IO> {
  if (!ioPromise) {
    ioPromise = (async () => {
      if (Platform.OS === 'web') {
        const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
        await LoadSkiaWeb({ locateFile: (file: string) => `${BASE_URL}/${file}` });
      }
      return import('./imageIO');
    })();
    ioPromise.catch(() => { ioPromise = null; });
  }
  return ioPromise;
}
