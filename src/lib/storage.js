import { idbGet, idbSet, idbGetFile, idbSetFile, clearUserCache, clearAllIDB } from './idb';
import { encrypt, decrypt } from './crypto';
import { supabase } from './supabase';

const EMPTY_VAULT = () => ({
  version: 1,
  chats: [],
  messages: {},
  starred: [],
  scrapbooks: [],
  updatedAt: new Date(0).toISOString(),
});

let activeUserId = null;
let activeKey = null;
let activeSalt = null;
let vault = EMPTY_VAULT();
let readyPromise = Promise.resolve();
let writeQueue = Promise.resolve();

const cacheKey = userId => `vault:${userId}`;
const isGuest = userId => String(userId || '').startsWith('guest_');

function safeVault(value) {
  return {
    ...EMPTY_VAULT(),
    ...(value && typeof value === 'object' ? value : {}),
    chats: Array.isArray(value?.chats) ? value.chats : [],
    messages: value?.messages && typeof value.messages === 'object' ? value.messages : {},
    starred: Array.isArray(value?.starred) ? value.starred : [],
    scrapbooks: Array.isArray(value?.scrapbooks) ? value.scrapbooks : [],
  };
}

async function fetchRemoteVault(userId, key) {
  if (!supabase || !key || isGuest(userId)) return null;
  const { data, error } = await supabase
    .from('user_data')
    .select('encrypted_blob, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.encrypted_blob) return null;
  const parsed = JSON.parse(await decrypt(key, data.encrypted_blob));
  return safeVault({ ...parsed, updatedAt: data.updated_at || parsed.updatedAt });
}

async function hydrate(userId, key) {
  const cached = safeVault(await idbGet(cacheKey(userId)));
  vault = cached;
  if (!isGuest(userId) && key) {
    const remote = await fetchRemoteVault(userId, key);
    if (remote) {
      vault = remote;
      await idbSet(cacheKey(userId), vault);
    }
  }
  return vault;
}

export async function configureStorage(userId, cryptoKey, salt = null) {
  activeUserId = userId;
  activeKey = cryptoKey || null;
  activeSalt = salt;
  readyPromise = hydrate(userId, cryptoKey);
  await readyPromise;
}

export function lockStorage() {
  activeUserId = null;
  activeKey = null;
  activeSalt = null;
  vault = EMPTY_VAULT();
  readyPromise = Promise.resolve();
}

async function ensureReady(userId) {
  if (!activeUserId || activeUserId !== userId) {
    await configureStorage(userId, null);
  } else {
    await readyPromise;
  }
}

async function persist() {
  if (!activeUserId) throw new Error('No active user');
  vault.updatedAt = new Date().toISOString();
  await idbSet(cacheKey(activeUserId), vault);
  if (!isGuest(activeUserId)) {
    if (!activeKey) throw new Error('Please sign in again to sync encrypted data');
    const encryptedBlob = await encrypt(activeKey, JSON.stringify(vault));
    if (!activeSalt) throw new Error('Encryption salt is unavailable. Please sign in again.');
    const { error } = await supabase.from('user_data').upsert({
      user_id: activeUserId,
      salt: activeSalt,
      encrypted_blob: encryptedBlob,
      updated_at: vault.updatedAt,
    }, { onConflict: 'user_id' });
    if (error) throw error;
  }
}

function queuePersist() {
  writeQueue = writeQueue.then(persist, persist);
  return writeQueue;
}

export async function getChats(userId) {
  await ensureReady(userId);
  return vault.chats;
}

export async function saveChats(userId, chats) {
  await ensureReady(userId);
  vault.chats = chats;
  return queuePersist();
}

export async function getMessages(userId, chatId) {
  await ensureReady(userId);
  const messages = vault.messages[chatId] || [];
  return Promise.all(messages.map(async message => {
    if (!message.mediaKey || (message.mediaUrl && !message.mediaUrl.startsWith('blob:'))) return message;
    const blob = await getFile(message.mediaKey);
    return blob ? { ...message, mediaUrl: URL.createObjectURL(blob) } : message;
  }));
}

export async function saveMessages(userId, chatId, messages) {
  await ensureReady(userId);
  const serializable = messages.map(message => {
    if (message.mediaUrl?.startsWith('blob:')) {
      const { mediaUrl, ...rest } = message;
      return rest;
    }
    return message;
  });
  vault.messages = { ...vault.messages, [chatId]: serializable };
  return queuePersist();
}

export async function searchAllMessages(userId, query) {
  await ensureReady(userId);
  const term = String(query || '').trim().toLowerCase();
  if (!term) return [];
  const results = [];
  for (const chat of vault.chats) {
    const messages = vault.messages[chat.id] || [];
    for (const message of messages) {
      const haystack = `${message.sender || ''} ${message.content || ''}`.toLowerCase();
      if (haystack.includes(term)) results.push({ ...message, chatId: chat.id, contactName: chat.contactName });
      if (results.length >= 100) return results;
    }
  }
  return results;
}

export async function getStarredMessages(userId) {
  await ensureReady(userId);
  return vault.starred;
}

export async function saveStarredMessages(userId, messages) {
  await ensureReady(userId);
  vault.starred = messages;
  return queuePersist();
}

export async function getScrapbooks(userId) {
  await ensureReady(userId);
  return vault.scrapbooks;
}

export async function saveScrapbooks(userId, scrapbooks) {
  await ensureReady(userId);
  vault.scrapbooks = scrapbooks;
  return queuePersist();
}

export async function saveFile(key, data) {
  return idbSetFile(`${activeUserId}:${key}`, data);
}

export async function getFile(key) {
  return idbGetFile(`${activeUserId}:${key}`);
}

export function getFileSync() { return null; }

export async function clearAllUserData(userId) {
  await clearUserCache(userId);
  if (activeUserId === userId) lockStorage();
}

export async function clearAllData() {
  lockStorage();
  await clearAllIDB();
}

export function generateId() {
  return `${Date.now().toString(36)}${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
}

export async function getStorageStats() {
  return { encrypted: Boolean(activeKey), synced: Boolean(activeKey && !isGuest(activeUserId)) };
}
