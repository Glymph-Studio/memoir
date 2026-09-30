import { openDB } from 'idb';

const DB_NAME = 'memoir_secure_cache';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache');
    if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
  },
});

export async function idbGet(key) {
  return (await dbPromise).get('cache', key);
}

export async function idbSet(key, value) {
  await (await dbPromise).put('cache', value, key);
  return true;
}

export async function idbRemove(key) {
  await (await dbPromise).delete('cache', key);
  return true;
}

export async function idbGetFile(key) {
  return (await dbPromise).get('files', key);
}

export async function idbSetFile(key, value) {
  await (await dbPromise).put('files', value, key);
  return key;
}

export async function idbRemoveFile(key) {
  await (await dbPromise).delete('files', key);
  return true;
}

export async function clearUserCache(userId) {
  const db = await dbPromise;
  await db.delete('cache', `vault:${userId}`);
}

export async function clearAllIDB() {
  const db = await dbPromise;
  await Promise.all([db.clear('cache'), db.clear('files')]);
}

export function getLocalStorageSnapshot() {
  return {};
}
