# Memoir

Memoir turns exported WhatsApp conversations into personal digital scrapbooks.

You can import a chat, read it in a clean conversation view, star meaningful messages, arrange memories on a scrapbook canvas, and export the result as an image.

## Features

1. Import WhatsApp text and zip exports
2. View imported conversations
3. Search chats and messages
4. Star text and images
5. Create scrapbooks with notes, text, photos, doodles, stickers, tape, and dates
6. Move, resize, rotate, and layer canvas elements
7. Preview and export scrapbooks as PNG files
8. Use guest mode with local browser storage
9. Create an account for encrypted synchronization through Supabase
10. Recover an account with a saved recovery phrase

## Privacy

Guest content is stored in the browser on the current device.

Account vault content is encrypted in the browser before it is stored through Supabase. Imported photo files are not uploaded to Supabase. Users should keep their password and recovery phrase private.

See the Privacy Policy, Terms and Conditions, Cookie Policy, and Refund Policy inside the application for more information.

## Requirements

Node.js 18 or newer

A Supabase project for account and synchronization features

## Setup

1. Clone the repository.

```bash
git clone https://github.com/Glymph-Studio/memoir.git
cd memoir
```

2. Install dependencies.

```bash
npm install
```

3. Copy the environment example.

```bash
cp .env.example .env
```

4. Add your Supabase project URL and public publishable key to `.env`.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_ANON_KEY
```

5. Run `supabase-schema.sql` in the Supabase SQL editor.

6. Start the development server.

```bash
npm run dev
```

## Production build

```bash
npm run build
```

The production output is created in `dist`.

## Technology

Memoir uses React, React Router, Vite, Tailwind CSS, Framer Motion, Lucide, JSZip, html2canvas, IndexedDB, Web Crypto, and Supabase.

## Security

Do not commit `.env`, passwords, recovery phrases, service role keys, private keys, imported chats, or personal photos.

The Supabase publishable key is intended for browser use. Security still depends on Row Level Security policies being configured correctly. Never place a Supabase service role key in this application.

If a secret is committed, remove it from the repository and rotate it immediately. Deleting it only from the latest commit is not enough because it remains in Git history.

## License

Memoir is available under the MIT License. See `LICENSE` for the full text.
