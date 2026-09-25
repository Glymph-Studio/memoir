/* ============================================
   Memoir — Storage v3 (Privacy-First)
   - Chats/Messages/Starred = MEMORY ONLY (never touches disk)
   - Scrapbooks/Users = IndexedDB (user-created, local only)
   - No WhatsApp data ever persisted for privacy
   ============================================ */

import { idbGet, idbSet, idbRemove, idbGetFile, idbSetFile, getLocalStorageSnapshot } from './idb';
import { 
  memGetChats, memSaveChats, 
  memGetMessages, memSaveMessages,
  memGetStarred, memSaveStarred,
  memClearUser, memClearAll, memAddBlobUrl, memRevokeAll
} from './memoryStore';

const PREFIX = 'memoir_';

// Migration - only for scrapbooks/users, NOT chats (privacy)
let migrated = false;
async function ensureMigrated() {
  if (migrated) return;
  migrated = true;
  try {
    const already = await idbGet('__migrated_v3');
    if (already) return;
    const snapshot = getLocalStorageSnapshot();
    // Only migrate scrapbooks and users, NOT chats/messages
    for (const [fullKey, value] of Object.entries(snapshot)) {
      const shortKey = fullKey.replace(PREFIX, '');
      if (shortKey.startsWith('chats_') || shortKey.startsWith('messages_') || shortKey.startsWith('starred_') || shortKey.startsWith('file_')) {
        // Skip - privacy, don't migrate chat data
        continue;
      }
      if (shortKey === 'users' || shortKey.startsWith('scrapbooks_') || shortKey === 'currentUser') {
        await idbSet(shortKey, value);
      }
    }
    await idbSet('__migrated_v3', true);
    // Clear old chat data from localStorage for privacy
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith(PREFIX + 'chats_') || k.startsWith(PREFIX + 'messages_') || k.startsWith(PREFIX + 'starred_') || k.startsWith(PREFIX + 'file_')) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  } catch (e) {
    console.warn('Migration v3 failed', e);
  }
}

// Generic IDB helpers (for scrapbooks/users only)
export async function getItem(key) {
  await ensureMigrated();
  try {
    const v = await idbGet(key);
    if (v !== null && v !== undefined) return v;
  } catch {}
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function setItem(key, value) {
  await ensureMigrated();
  try {
    await idbSet(key, value);
    try {
      const str = JSON.stringify(value);
      if (str.length < 500000) localStorage.setItem(PREFIX + key, str);
    } catch {}
    return true;
  } catch {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
  }
}

export async function removeItem(key) {
  await ensureMigrated();
  try { await idbRemove(key); } catch {}
  try { localStorage.removeItem(PREFIX + key); } catch {}
}

// Sync variants for boot
export function getItemSync(key) {
  try { const raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ---- Auth (IDB, local only) ----
export async function getUsers() { return (await getItem('users')) || []; }
export async function saveUsers(users) { return await setItem('users', users); }
export async function getCurrentUser() { return await getItem('currentUser'); }
export async function setCurrentUser(user) { return await setItem('currentUser', user); }
export async function clearCurrentUser() { return await removeItem('currentUser'); }

export function getCurrentUserSync() { return getItemSync('currentUser'); }
export function getUsersSync() { return getItemSync('users') || []; }
export function saveUsersSync(users) { try { localStorage.setItem(PREFIX + 'users', JSON.stringify(users)); } catch {} idbSet('users', users).catch(()=>{}); }
export function setCurrentUserSync(user) { try { localStorage.setItem(PREFIX + 'currentUser', JSON.stringify(user)); } catch {} idbSet('currentUser', user).catch(()=>{}); }
export function clearCurrentUserSync() { try { localStorage.removeItem(PREFIX + 'currentUser'); } catch {} idbRemove('currentUser').catch(()=>{}); }

// ---- Chats (MEMORY ONLY - Privacy) ----
export async function getChats(userId) {
  await ensureMigrated();
  return memGetChats(userId);
}
export async function saveChats(userId, chats) {
  memSaveChats(userId, chats);
  return true;
}

// ---- Messages (MEMORY ONLY) ----
export async function getMessages(userId, chatId) {
  return memGetMessages(userId, chatId);
}
export async function saveMessages(userId, chatId, messages) {
  // Track blob URLs for revocation
  for (const m of messages) {
    if (m.mediaUrl && m.mediaUrl.startsWith('blob:')) {
      memAddBlobUrl(m.mediaUrl, true);
    }
  }
  memSaveMessages(userId, chatId, messages);
  return true;
}

// ---- Starred (MEMORY ONLY) ----
export async function getStarredMessages(userId) {
  return memGetStarred(userId);
}
export async function saveStarredMessages(userId, messages) {
  memSaveStarred(userId, messages);
  return true;
}

// ---- Scrapbooks (IDB - user created, local only) ----
export async function getScrapbooks(userId) {
  await ensureMigrated();
  const data = await getItem(`scrapbooks_${userId}`);
  // Debug log to catch empty case
  if (!data) {
    console.log('[Storage] No scrapbooks found for', userId);
    return [];
  }
  return data;
}
export async function saveScrapbooks(userId, scrapbooks) {
  console.log('[Storage] Saving', scrapbooks.length, 'scrapbooks for', userId);
  return await setItem(`scrapbooks_${userId}`, scrapbooks);
}

// ---- File storage (IDB, but only for scrapbook images user explicitly adds) ----
export async function saveFile(key, dataUrl) {
  await ensureMigrated();
  try {
    // Compress dataUrl if too large (>1MB)
    if (dataUrl && dataUrl.length > 1024 * 1024) {
      console.warn('[Storage] Large file, compressing', key, dataUrl.length);
      // Will be compressed by caller, but save anyway
    }
    await idbSetFile(key, dataUrl);
    return key;
  } catch (e) {
    console.warn('IDB file save failed', e);
    return null;
  }
}

export async function getFile(key) {
  await ensureMigrated();
  try { const data = await idbGetFile(key); if (data) return data; } catch {}
  return null;
}

export function getFileSync(key) { return null; }

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function getStorageStats() {
  await ensureMigrated();
  let lsSize = 0;
  try {
    for (let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k?.startsWith(PREFIX)) lsSize+=(localStorage.getItem(k)?.length||0);
    }
  } catch {}
  return { lsSizeKB: Math.round(lsSize/1024), mode: 'privacy-memory', chatsInMemory: true };
}

// Privacy helpers
export async function clearAllUserData(userId) {
  memClearUser(userId);
  // Keep scrapbooks? For privacy, option to clear them too
  try { sessionStorage.clear(); } catch {}
  memRevokeAll();
}

export async function clearAllData() {
  memClearAll();
  try {
    const { clearAllIDB } = await import('./idb');
    await clearAllIDB();
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
}
