// "My Designs": metadata index in AsyncStorage, images in blobStore.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resizeToMax, type RGBAImage } from '../processing/core';
import { DEFAULT_PARAMS } from '../processing/pipeline';
import { DEFAULT_TEXT } from '../processing/layout';
import type { DesignSettings } from '../state/session';
import { getImageIO } from '../skia';
import { renderPng } from '../render';
import { blobUri, deleteBlob, getBlob, putBlob } from './blobStore';

const INDEX = 'noseprint:designs';

export interface SavedDesign extends DesignSettings {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export async function listDesigns(): Promise<SavedDesign[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX);
    const list: SavedDesign[] = raw ? JSON.parse(raw) : [];
    return list
      .map((d) => ({ ...d, params: { ...DEFAULT_PARAMS, ...d.params }, text: { ...DEFAULT_TEXT, ...d.text } }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

async function writeIndex(list: SavedDesign[]) {
  await AsyncStorage.setItem(INDEX, JSON.stringify(list));
}

/** Save (or update when `id` is given) a design: source photo + thumbnail + settings. */
export async function saveDesign(source: RGBAImage, s: DesignSettings, id?: string | null): Promise<SavedDesign> {
  const io = await getImageIO();
  const now = Date.now();
  const list = await listDesigns();
  const existing = id ? list.find((d) => d.id === id) : undefined;
  const newId = existing?.id ?? `${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  if (!existing) await putBlob(`${newId}-src.jpg`, io.encode(resizeToMax(source, 1600), 'jpeg'));
  await putBlob(`${newId}-thumb.png`, await renderPng(resizeToMax(source, 320), s, false));
  const title = s.text.name.trim() || `Design ${new Date(now).toLocaleDateString()}`;
  const rec: SavedDesign = { ...s, id: newId, title, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await writeIndex([rec, ...list.filter((d) => d.id !== newId)]);
  return rec;
}

export async function loadDesignSource(id: string): Promise<RGBAImage> {
  const b64 = await getBlob(`${id}-src.jpg`);
  if (!b64) throw new Error('The photo for this design is missing.');
  const io = await getImageIO();
  return io.decodeUri(`data:image/jpeg;base64,${b64}`);
}

export const thumbUri = (id: string) => blobUri(`${id}-thumb.png`, 'image/png');

export async function deleteDesign(id: string): Promise<void> {
  await Promise.all([deleteBlob(`${id}-src.jpg`), deleteBlob(`${id}-thumb.png`)]);
  await writeIndex((await listDesigns()).filter((d) => d.id !== id));
}
