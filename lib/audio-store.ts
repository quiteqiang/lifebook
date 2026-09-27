import type { MemoryEntry } from './memories';

const memoryFallback = new Map<string, Blob>();
const DATABASE = 'lifebook-audio';
const STORE = 'recordings';

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudio(entry: MemoryEntry, blob: Blob): Promise<void> {
  const database = await openDatabase().catch(() => null);
  if (!database) {
    memoryFallback.set(entry.id, blob);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put({ id: entry.id, blob });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function readAudio(id: string): Promise<Blob | null> {
  const database = await openDatabase().catch(() => null);
  if (!database) return memoryFallback.get(id) ?? null;
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result?.blob as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return blob;
}

