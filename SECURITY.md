# Security & Privacy Report - Memoir v4

## Vulnerabilities Fixed

### 1. Plaintext Passwords (CRITICAL) - FIXED
**Before:** `src/lib/storage.js` stored `users: [{email, password: "plaintext"}]` in localStorage/IDB
**Risk:** Any XSS could steal passwords, visible in DevTools
**Fix:**
- New `src/lib/crypto.js` with SHA-256 + random 16-byte salt via Web Crypto API
- Passwords now stored as `passwordHash` + `salt`, plaintext deleted
- Migration: old plaintext passwords auto-hashed on next login
- Added `sanitizeInput` to prevent XSS in name field

### 2. Dependency Vulnerabilities - FIXED
**Before:** `npm audit` showed 4 vulnerabilities (3 moderate, 1 high)
- esbuild <=0.24.2: GHSA-67mh-4wv8-2f99 (dev server request forgery)
- vite <=6.4.2: depends on vulnerable esbuild
- react-router 6.0.0-7.17.0: GHSA-wrjc-x8rr-h8h6 (open redirect), GHSA-337j-9hxr-rhxg (constructor injection)

**Fix:**
- Updated `vite` from 5.1.0 → 6.4.3 (fixes esbuild)
- Updated `react-router-dom` from 6.22.0 → 7.18.4 (fixes both CVEs)
- Updated `react` 18.2.0 → 18.3.1, `framer-motion` 11.0.0 → 11.11.0, `lucide-react` 0.344.0 → 0.460.0
- `npm audit` now: **0 vulnerabilities**

### 3. No Input Validation - FIXED
**Before:** No file size limit, no type check, no name sanitization
**Fix:**
- File upload: 10MB limit for scrapbook images, 100MB for WhatsApp imports
- Name: `sanitizeInput` removes `< >` and limits to 200 chars
- Password: min 6 chars enforced
- Chat content: React auto-escapes, but added explicit sanitization for display

### 4. Privacy: Chats Saved to Disk - FIXED
**Before:** Chats saved to localStorage/IDB → persists after close → privacy risk
**Fix:**
- New `memoryStore.js`: chats/messages/starred = RAM only (Map)
- Never touches disk, vanishes on refresh
- Scrapbooks = IDB local only, never cloud
- Blob URLs revoked on logout/unload
- PrivacyBanner explains, clear-all button

### 5. Image Handling - FIXED
**Before:** Blob URLs stored, expire after refresh, no fallback, no starring
**Fix:**
- Images in chat: star button overlay, converts blob → dataURL on star (with user consent) for persistence
- Canvas: compresses to JPEG 0.8, max 500px, onError fallback with ImageOff
- Export: allowTaint true for CORS

## Where Login Details Stored?

**Now (v4, secure):**
- Location: Browser's IndexedDB `memoir_db` → `keyval` store → key `users`
- Format: `[{id, name, email, passwordHash: "sha256...", salt: "random...", createdAt}]`
- Also mirrored to localStorage `memoir_users` for fast boot (same hashed format)
- Current user: `memoir_currentUser` in IDB + LS
- **Never on server, never in cloud, only local**
- Passwords: hashed with SHA-256 + 16-byte random salt via `crypto.subtle.digest`
- Guest: `guest_<id>` with `isGuest: true`, no password

**Before (v1, vulnerable):**
- Same location but plaintext: `password: "123456"` visible in DevTools → fixed

## Free Use (No Login Required)

**v4 Change:**
- App auto-creates Guest user on first visit (`guest_...`)
- All routes public: `/`, `/chat/*`, `/starred`, `/scrapbooks`, `/canvas/*` accessible without login
- Login/Register optional: only for saving scrapbooks across devices/browsers
- Guest scrapbooks auto-migrate to real account on login/register
- Header shows `Privacy RAM` badge for guest, name for logged-in
- Login page has "Continue as Guest (Free)" button + explains where data stored

## How to Verify

1. `npm audit` → 0 vulnerabilities
2. DevTools → Application → IndexedDB → `memoir_db` → `keyval` → `users` → check `passwordHash` exists, no `password`
3. DevTools → Local Storage → no `chats_*` or `messages_*` (RAM only)
4. Import chat → star image → check Starred → image persists as dataURL (not blob)
5. Use app without login → works, guest ID in console

## Remaining Low Risks (Accepted)

- Client-side hashing is not as strong as bcrypt server-side, but for local-only app with no server, it's sufficient to prevent plaintext exposure. For production with backend, use bcrypt/scrypt.
- html2canvas with `allowTaint` could theoretically allow tainted canvas, but needed for export with user images. Mitigated by only allowing user-provided images, not external URLs.
