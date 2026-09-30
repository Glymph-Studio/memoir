const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function generateSalt() {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(secret, salt) {
  if (!secret || !salt) throw new Error('Secret and salt are required');
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64ToBytes(salt), iterations: 310000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function generateDataKey() {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  return { key: await importDataKey(raw), encoded: bytesToBase64(raw) };
}

export async function importDataKey(rawOrBase64) {
  const raw = typeof rawOrBase64 === 'string' ? base64ToBytes(rawOrBase64) : rawOrBase64;
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(cryptoKey, plaintext) {
  if (!cryptoKey) throw new Error('Encryption key is unavailable');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoder.encode(plaintext));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decrypt(cryptoKey, payload) {
  if (!cryptoKey) throw new Error('Encryption key is unavailable');
  const parts = String(payload || '').split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('Invalid encrypted payload');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(parts[0]) },
    cryptoKey,
    base64ToBytes(parts[1])
  );
  return decoder.decode(plaintext);
}

const LEFT = ['amber','apple','april','autumn','bamboo','berry','blue','brave','bright','calm','cedar','cherry','cloud','coral','cosmic','dawn','dream','ember','fern','gentle','gold','happy','hazel','honey','indigo','jade','lilac','lucky','lunar','maple','mint','mist'];
const RIGHT = ['anchor','bird','bloom','brook','candle','cloud','comet','daisy','dove','field','flame','forest','garden','harbor','hill','island','lake','leaf','light','meadow','moon','ocean','pearl','pine','river','rose','sky','star','stone','sun','trail','wave'];

export function generateRecoveryPhrase() {
  const random = crypto.getRandomValues(new Uint16Array(12));
  return Array.from(random, value => `${LEFT[value & 31]}-${RIGHT[(value >> 5) & 31]}`).join(' ');
}

export function normalizeRecoveryPhrase(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function generateGuestId() {
  return `guest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

export function getOrCreateGuestId() {
  const key = 'memoir_guest_id';
  try {
    const existing = localStorage.getItem(key);
    if (existing?.startsWith('guest_')) return existing;
    const created = generateGuestId();
    localStorage.setItem(key, created);
    return created;
  } catch {
    return generateGuestId();
  }
}

export function sanitizeInput(value) {
  return String(value || '').replace(/[<>]/g, '').slice(0, 200);
}
