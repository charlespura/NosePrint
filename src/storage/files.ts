import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export type Kind = 'png' | 'svg';
const MIME: Record<Kind, string> = { png: 'image/png', svg: 'image/svg+xml' };

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function webBlob(content: string, kind: Kind): Blob {
  return kind === 'png' ? new Blob([b64ToBytes(content) as BlobPart], { type: MIME.png }) : new Blob([content], { type: MIME.svg });
}

function webDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Write to the app cache and return the file (native only). PNG content is base64. */
async function cacheFile(content: string, kind: Kind, name: string): Promise<File> {
  const file = new File(Paths.cache, `${name}.${kind}`);
  file.create({ overwrite: true });
  await file.write(content, kind === 'png' ? { encoding: 'base64' } : undefined);
  return file;
}

export type SaveResult = 'saved' | 'downloaded' | 'shared' | 'denied' | 'unavailable';

/**
 * Save a design. Web: download. Native PNG: photo library.
 * Native SVG: galleries can't hold SVG, so it opens the share sheet ("Save to Files", Drive, email…).
 */
export async function saveFile(content: string, kind: Kind, name: string): Promise<SaveResult> {
  if (Platform.OS === 'web') { webDownload(webBlob(content, kind), `${name}.${kind}`); return 'downloaded'; }
  if (kind === 'svg') return shareFile(content, kind, name);
  const { status } = await requestPermissionsAsync(true);
  if (status !== 'granted') return 'denied';
  const file = await cacheFile(content, kind, name);
  await Asset.create(file.uri);
  return 'saved';
}

/** Open the system share sheet (web: Web Share API with files, falling back to download). */
export async function shareFile(content: string, kind: Kind, name: string): Promise<SaveResult> {
  const filename = `${name}.${kind}`;
  if (Platform.OS === 'web') {
    const blob = webBlob(content, kind);
    const file = new globalThis.File([blob], filename, { type: MIME[kind] });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'NosePrint' }); return 'shared'; } catch { return 'unavailable'; }
    }
    webDownload(blob, filename);
    return 'downloaded';
  }
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const file = await cacheFile(content, kind, name);
  await Sharing.shareAsync(file.uri, { mimeType: MIME[kind], dialogTitle: 'Share your NosePrint' });
  return 'shared';
}

export function resultMessage(r: SaveResult, kind: Kind): string {
  switch (r) {
    case 'saved': return '✓ Saved to your photo library.';
    case 'downloaded': return `✓ ${kind.toUpperCase()} downloaded.`;
    case 'shared': return '✓ Shared.';
    case 'denied': return 'Photo library permission was denied. Enable it in Settings to save.';
    default: return 'Sharing is not available on this device.';
  }
}
