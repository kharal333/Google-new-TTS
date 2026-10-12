export interface StoredConversion {
  id: string;
  title: string;
  text: string;
  characterId: string;
  characterName: string;
  characterGender: 'female' | 'male';
  baseVoice: string;
  audioBlob?: Blob;
  audioUrl?: string;
  durationSeconds: number;
  wordCount: number;
  characterCount: number;
  createdAt: string;
  format: 'wav' | 'mp3';
  isFavorite: boolean;
  cloudSync?: {
    googleDrive?: { synced: boolean; fileId?: string; url?: string };
    dropbox?: { synced: boolean; fileId?: string; url?: string };
  };
  tags: string[];
}

const DB_NAME = 'AuraVoiceStudio_DB';
const DB_VERSION = 1;
const STORE_NAME = 'conversions';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('characterId', 'characterId', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveConversionToDB(item: StoredConversion): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB, falling back to in-memory/localStorage:', err);
  }
}

export async function getAllConversionsFromDB(): Promise<StoredConversion[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as StoredConversion[];
        // Sort descending by creation date
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB:', err);
    return [];
  }
}

export async function deleteConversionFromDB(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

export async function updateFavoriteInDB(id: string, isFavorite: boolean): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result as StoredConversion;
        if (item) {
          item.isFavorite = isFavorite;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Could not update favorite in IndexedDB:', err);
  }
}

export async function updateCloudSyncInDB(
  id: string,
  provider: 'googleDrive' | 'dropbox',
  syncData: { synced: boolean; fileId?: string; url?: string }
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result as StoredConversion;
        if (item) {
          if (!item.cloudSync) item.cloudSync = {};
          item.cloudSync[provider] = syncData;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Could not update cloud sync in IndexedDB:', err);
  }
}
