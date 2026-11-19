// Tiny key → base64 string store. Native: files in the document directory. Web: IndexedDB.
import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

const DB = 'noseprint', STORE = 'blobs';

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await idb();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

function dir(): Directory {
  const d = new Directory(Paths.document, 'designs');
  d.create({ idempotent: true, intermediates: true });
  return d;
}

export async function putBlob(key: string, base64: string): Promise<void> {
  if (Platform.OS === 'web') { await tx('readwrite', (s) => s.put(base64, key)); return; }
  const f = new File(dir(), key);
  f.create({ overwrite: true });
  await f.write(base64, { encoding: 'base64' });
}

export async function getBlob(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return (await tx<string | undefined>('readonly', (s) => s.get(key))) ?? null;
  const f = new File(dir(), key);
  return f.exists ? f.base64() : null;
}

/** A URI an <Image> can show (file:// on native, data: on web). */
export async function blobUri(key: string, mime: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    const b = await getBlob(key);
    return b ? `data:${mime};base64,${b}` : null;
  }
  const f = new File(dir(), key);
  return f.exists ? f.uri : null;
}

export async function deleteBlob(key: string): Promise<void> {
  if (Platform.OS === 'web') { await tx('readwrite', (s) => s.delete(key)); return; }
  const f = new File(dir(), key);
  if (f.exists) f.delete();
}
