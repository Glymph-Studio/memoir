// Simple client-side hashing for privacy - NOT for production server auth
// Uses Web Crypto API SHA-256 with salt
// This fixes plaintext password vulnerability

export async function hashPassword(password, salt = null) {
  if (!salt) {
    // Generate random salt
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    salt = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: hashHex, salt };
}

export async function verifyPassword(password, storedHash, salt) {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// For guest ID
export function generateGuestId() {
  return 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Sanitize user input to prevent XSS
export function sanitizeInput(str) {
  if (!str) return '';
  return str.replace(/[<>]/g, '').slice(0, 200);
}
