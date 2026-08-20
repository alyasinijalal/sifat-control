// IndexedDB Storage Helper for handling large datasets (40,000+ batch items)
// Prevents localStorage quota exceeded errors and browser main thread crashes.

const DB_NAME = 'SifatFarmaDB';
const DB_VERSION = 1;
const BATCHES_STORE = 'batches';
const META_STORE = 'meta';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BATCHES_STORE)) {
        db.createObjectStore(BATCHES_STORE);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBatchesToDB(batches: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCHES_STORE, 'readwrite');
    const store = tx.objectStore(BATCHES_STORE);
    store.put(batches, 'all_batches');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save batches to IndexedDB, falling back to localStorage:', err);
    try {
      // Only try localStorage if data is small
      if (batches.length < 3000) {
        localStorage.setItem('sifat_farma_batches', JSON.stringify(batches));
      }
    } catch (e) {
      console.warn('localStorage quota exceeded:', e);
    }
  }
}

export async function loadBatchesFromDB(): Promise<any[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCHES_STORE, 'readonly');
    const store = tx.objectStore(BATCHES_STORE);
    const request = store.get('all_batches');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load batches from IndexedDB:', err);
    return null;
  }
}

export async function clearAllBatchesFromDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCHES_STORE, 'readwrite');
    const store = tx.objectStore(BATCHES_STORE);
    store.delete('all_batches');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to clear batches from IndexedDB:', err);
  }
}

export async function saveMetaToDB(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(META_STORE, 'readwrite');
    const store = tx.objectStore(META_STORE);
    store.put(value, key);
  } catch (err) {
    console.warn(`Failed to save ${key} to IndexedDB:`, err);
  }
}

export async function loadMetaFromDB(key: string): Promise<any | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(META_STORE, 'readonly');
    const store = tx.objectStore(META_STORE);
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}
