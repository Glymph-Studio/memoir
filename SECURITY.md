# Memoir Security Architecture

## Data protection

Memoir uses Supabase Auth for account authentication and client-side encryption for user content. Supabase stores the random salt, wrapped keys, recovery wrapper, and an AES-GCM ciphertext blob. Plaintext chats, starred messages, and scrapbook content are not uploaded.

## Encryption

- Content key: random 256-bit AES-GCM key per account
- Content encryption: AES-256-GCM with a fresh 96-bit IV for every write
- Password wrapping key: PBKDF2-HMAC-SHA-256, 310,000 iterations, random 128-bit salt
- Recovery wrapping key: independently derived with PBKDF2 and an independent random salt
- Recovery phrase: 12 independently generated 10-bit word pairs, approximately 120 bits of entropy
- Runtime content key: imported as non-extractable and held only in React memory
- Passwords: handled by Supabase Auth and never stored by Memoir

The random content key is wrapped separately by the password-derived key and recovery-derived key. Changing a password re-wraps the same content key without re-encrypting or exposing user content.

## Refresh and unlock behavior

Supabase may restore its authenticated session after refresh, but Memoir does not persist the plaintext content key. The user therefore sees an unlock screen and enters their password to derive the wrapping key again. This is intentional and prevents browser storage from becoming a durable decryption credential.

## Authorization

The `user_data` table has Row Level Security enabled. Select, insert, update, and delete policies require `auth.uid() = user_id`. The frontend uses only the public Supabase anon key. A service-role key must never be included in client code or Vercel `VITE_` variables.

## Local cache

IndexedDB caches decrypted user content and local media on the user's device. Logging out clears the user's decrypted cache. Browser and device security remain part of the threat model: malicious extensions, an already compromised browser profile, or active XSS could access data while the vault is unlocked.

## Input and rendering safety

- React escapes imported message text by default
- User names are length-limited and strip angle brackets
- Imports and scrapbook image uploads have size limits
- External media windows use `noopener` and `noreferrer`
- No `dangerouslySetInnerHTML`, `eval`, or service-role credentials are used

## Dependency and build verification

Run before deployment:

```bash
npm ci
npm audit --omit=dev
npm run build
```

The latest reviewed build reports zero known npm audit vulnerabilities. This does not guarantee the absence of undiscovered vulnerabilities.

## Recovery limitations

Users must save their recovery phrase. Neither Supabase nor the Memoir operator can decrypt user content or recreate a lost content key. Accounts created before recovery wrapping was introduced receive a new recovery phrase after their first successful migration login.
