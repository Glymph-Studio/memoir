// Memoir IndexedDB wrapper - no dependencies
const DB_NAME = 'memoir_db';
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // v1 stores
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'key' });
      }
      // v2 - dedicated stores for faster queries
      if (!db.objectStoreNames.contains('chats')) {
        const chats = db.createObjectStore('chats', { keyPath: 'id' });
        chats.createIndex('userId', 'userId', { unique: false });
      }
      if (!db.objectStoreNames.contains('messages')) {
        const msgs = db.createObjectStore('messages', { keyPath: 'id' });
        msgs.createIndex('userId_chatId', ['userId', 'chatId'], { unique: false });
        msgs.createIndex('chatId', 'chatId', { unique: false });
      }
      if (!db.objectStoreNames.contains('starred')) {
        const starred = db.createObjectStore('starred', { keyPath: 'id' });
        starred.createIndex('userId', 'userId', { unique: false });
      }
      if (!db.objectStoreNames.contains('scrapbooks')) {
        const sb = db.createObjectStore('scrapbooks', { keyPath: 'id' });
        sb.createIndex('userId', 'userId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise = null;
function getDB() {
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

async function tx(storeName, mode, fn) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try {
      result = fn(store);
    } catch (e) {
      reject(e);
      return;
    }
    // If fn returns a request, wait for it
    if (result && result.onsuccess !== undefined) {
      result.onsuccess = () => resolve(result.result);
      result.onerror = () => reject(result.error);
    } else {
      // For cases where fn does sync work and we rely on transaction
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    }
  });
}

// Keyval store (generic JSON)
export async function idbGet(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction('keyval', 'readonly');
      const store = t.objectStore('keyval');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbSet(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('keyval', 'readwrite');
    const store = t.objectStore('keyval');
    const req = store.put({ key, value, updatedAt: Date.now() });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function idbRemove(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('keyval', 'readwrite');
    const store = t.objectStore('keyval');
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// Files store (blobs / dataUrls)
export async function idbGetFile(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction('files', 'readonly');
      const store = t.objectStore('files');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbSetFile(key, data) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('files', 'readwrite');
    const store = t.objectStore('files');
    const req = store.put({ key, data, updatedAt: Date.now() });
    req.onsuccess = () => resolve(key);
    req.onerror = () => reject(req.error);
  });
}

// Migration helper - read from localStorage
export function getLocalStorageSnapshot() {
  const snapshot = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('memoir_')) {
        try {
          snapshot[k] = JSON.parse(localStorage.getItem(k));
        } catch {
          snapshot[k] = localStorage.getItem(k);
        }
      }
    }
  } catch {}
  return snapshot;
}

export async function clearAllIDB() {
  const db = await getDB();
  const stores = ['keyval', 'files', 'chats', 'messages', 'starred', 'scrapbooks'];
  for (const name of stores) {
    if (db.objectStoreNames.contains(name)) {
      await new Promise((res, rej) => {
        const t = db.transaction(name, 'readwrite');
        t.objectStore(name).clear();
        t.oncomplete = () => res();
        t.onerror = () => rej(t.error);
      });
    }
  }
}
