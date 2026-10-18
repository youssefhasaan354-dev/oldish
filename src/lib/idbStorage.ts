/**
 * IndexedDB storage engine for local demo mode image blobs.
 * Overcomes localStorage's ~5MB limitation and prevents silent storage failures.
 */

const DB_NAME = 'OldishMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

let dbPromise: Promise<IDBDatabase> | null = null;
const blobUrlCache = new Map<string, string>();

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

/**
 * Save an image Blob to IndexedDB with quota error handling
 */
export async function saveBlob(id: string, blob: Blob): Promise<string> {
  try {
    const db = await getDB();
    return await new Promise<string>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);

      req.onsuccess = () => {
        // Create and cache object URL
        const oldUrl = blobUrlCache.get(id);
        if (oldUrl) {
          try { URL.revokeObjectURL(oldUrl); } catch { /* ignore */ }
        }
        const newUrl = URL.createObjectURL(blob);
        blobUrlCache.set(id, newUrl);
        resolve(newUrl);
      };

      req.onerror = () => {
        if (req.error?.name === 'QuotaExceededError') {
          reject(new Error('مساحة التخزين في المتصفح ممتلئة (Storage quota exceeded). يرجى حذف بعض الصور القديمة أو تصدير البيانات.'));
        } else {
          reject(req.error || new Error('Failed to save image blob'));
        }
      };
    });
  } catch (err) {
    console.error('IndexedDB saveBlob error:', err);
    throw err;
  }
}

/**
 * Get an image Blob by ID from IndexedDB
 */
export async function getBlob(id: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve((req.result as Blob) || null);
      };

      req.onerror = () => {
        reject(req.error || new Error('Failed to read image blob'));
      };
    });
  } catch (err) {
    console.warn('IndexedDB getBlob error:', err);
    return null;
  }
}

/**
 * Resolves a blob ID into a live Object URL, using memory cache where possible
 */
export async function resolveBlobUrl(id: string): Promise<string | null> {
  if (blobUrlCache.has(id)) {
    return blobUrlCache.get(id)!;
  }

  const blob = await getBlob(id);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  blobUrlCache.set(id, url);
  return url;
}

/**
 * Delete a specific image Blob from IndexedDB
 */
export async function deleteBlob(id: string): Promise<void> {
  try {
    const oldUrl = blobUrlCache.get(id);
    if (oldUrl) {
      try { URL.revokeObjectURL(oldUrl); } catch { /* ignore */ }
      blobUrlCache.delete(id);
    }

    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to delete image blob'));
    });
  } catch (err) {
    console.warn('IndexedDB deleteBlob error:', err);
  }
}

/**
 * List all stored blob IDs
 */
export async function getAllBlobIds(): Promise<string[]> {
  try {
    const db = await getDB();
    return await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();

      req.onsuccess = () => {
        resolve((req.result as string[]) || []);
      };

      req.onerror = () => reject(req.error || new Error('Failed to list blob keys'));
    });
  } catch (err) {
    console.warn('IndexedDB getAllBlobIds error:', err);
    return [];
  }
}

/**
 * Clean up orphan blobs not in active list
 */
export async function cleanupOrphanBlobs(activeBlobIds: string[]): Promise<number> {
  try {
    const activeSet = new Set(activeBlobIds);
    const allKeys = await getAllBlobIds();
    let cleanedCount = 0;

    for (const key of allKeys) {
      if (!activeSet.has(key)) {
        await deleteBlob(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  } catch (err) {
    console.warn('Cleanup orphan blobs error:', err);
    return 0;
  }
}

/**
 * Clear all media blobs (for owner demo reset)
 */
export async function clearAllBlobs(): Promise<void> {
  try {
    // Revoke all cached URLs
    blobUrlCache.forEach(url => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    });
    blobUrlCache.clear();

    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to clear object store'));
    });
  } catch (err) {
    console.warn('IndexedDB clearAllBlobs error:', err);
  }
}
