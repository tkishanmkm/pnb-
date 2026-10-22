const DB_NAME = 'pnb_pro_db';
const STORE_NAME = 'app_state';
const STATE_KEY = 'current_state';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Serialize writes so rapid updates cannot finish out of order.
let writeQueue: Promise<void> = Promise.resolve();

export function saveStateToIndexedDB(state: unknown): Promise<void> {
  const write = writeQueue.then(async () => {
    const db = await openDB();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(state, STATE_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
        transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
      });
    } finally {
      db.close();
    }
  });
  writeQueue = write.catch(() => undefined);
  return write;
}

export async function getStateFromIndexedDB(): Promise<any | null> {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB read transaction aborted.'));
    });
  } finally {
    db.close();
  }
}

export async function clearStateFromIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STATE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB delete error:", error);
    throw error;
  }
}

export async function getStorageEstimate(): Promise<{ usage?: number; quota?: number; percentage?: number }> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage;
      const quota = estimate.quota;
      const percentage = usage && quota ? (usage / quota) * 100 : undefined;
      return { usage, quota, percentage };
    } catch (error) {
      console.error("Storage estimate error:", error);
    }
  }
  return {};
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch (error) {
      console.error("Persistent storage request error:", error);
    }
  }
  return false;
}
