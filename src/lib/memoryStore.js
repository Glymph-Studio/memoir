// Privacy-first memory store - chats never touch disk
// This ensures WhatsApp chats/photos are NOT persisted to IndexedDB/localStorage
// Only lives in RAM, cleared on refresh/logout

const memory = {
  chats: new Map(), // userId -> chats[]
  messages: new Map(), // `${userId}_${chatId}` -> messages[]
  starred: new Map(), // userId -> starred[]
  mediaBlobs: new Map(), // blobUrl -> blob (for revocation)
};

export function memGetChats(userId) {
  return memory.chats.get(userId) || [];
}

export function memSaveChats(userId, chats) {
  memory.chats.set(userId, chats);
}

export function memGetMessages(userId, chatId) {
  return memory.messages.get(`${userId}_${chatId}`) || [];
}

export function memSaveMessages(userId, chatId, messages) {
  memory.messages.set(`${userId}_${chatId}`, messages);
}

export function memGetStarred(userId) {
  return memory.starred.get(userId) || [];
}

export function memSaveStarred(userId, starred) {
  memory.starred.set(userId, starred);
}

export function memAddBlobUrl(url, blob) {
  memory.mediaBlobs.set(url, blob);
}

export function memRevokeAll() {
  for (const url of memory.mediaBlobs.keys()) {
    try { URL.revokeObjectURL(url); } catch {}
  }
  memory.mediaBlobs.clear();
}

export function memClearUser(userId) {
  memory.chats.delete(userId);
  memory.starred.delete(userId);
  // clear all messages for user
  for (const key of memory.messages.keys()) {
    if (key.startsWith(`${userId}_`)) memory.messages.delete(key);
  }
  memRevokeAll();
}

export function memClearAll() {
  memory.chats.clear();
  memory.messages.clear();
  memory.starred.clear();
  memRevokeAll();
}

// Session backup (optional) - stores in sessionStorage which clears on tab close, not persistent
// This is still privacy-safe as sessionStorage is cleared when tab closes
export function sessionBackupChats(userId, chats) {
  try {
    sessionStorage.setItem(`memoir_session_chats_${userId}`, JSON.stringify(chats.slice(0, 50).map(c => ({...c, lastMessage: c.lastMessage?.slice(0,100)}))));
  } catch {}
}

export function sessionBackupMessages(userId, chatId, messages) {
  // Don't backup full messages to disk for privacy, only metadata
  try {
    sessionStorage.setItem(`memoir_session_meta_${userId}_${chatId}`, JSON.stringify({count: messages.length, savedAt: Date.now()}));
  } catch {}
}
