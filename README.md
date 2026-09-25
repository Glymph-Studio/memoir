# 📖 Memoir

**Your memories, beautifully preserved.**

Memoir is a web application that transforms your WhatsApp chat histories into beautiful, creative scrapbooks. Import your conversations, highlight important moments, and arrange them into digital keepsakes you can export and share.

![Memoir](https://img.shields.io/badge/Memoir-v1.0-memoir)

---

## ✨ Features

### 💬 Chat Import
- Import WhatsApp chat exports (`.txt` and `.zip` files)
- Parses messages, timestamps, and media from zip archives
- View conversations with familiar chat bubble styling
- Media gallery for browsing shared images

### ⭐ Starred Messages
- Star important messages from any conversation
- View all starred messages grouped by contact
- Quickly navigate back to the original chat

### 📒 Scrapbook Canvas Editor
A free-form creative canvas with these tools:
- **Text** — Custom text with font, color, size, weight, style, and alignment options
- **Photos** — Upload images from your device
- **Notes** — Colorful sticky notes in 8 colors
- **Stickers** — Emoji stickers organized by category (Faces, Hearts, Nature, etc.)
- **Starred Messages** — Drag starred conversations directly onto the canvas
- **Washi Tape** — Decorative tape elements in 7 colors
- **Date Stamps** — Stylized date markers

### 🎨 Canvas Features
- **Drag & Drop** — Freely position all elements
- **Resize** — Corner handles for resizing
- **Rotate** — Rotate elements to any angle
- **Layering** — Z-index management, auto-bring-to-front
- **Undo** — Revert the last action
- **Themes** — 8 paper-style backgrounds (Cream, Kraft, White, Vintage, Dark, Rose, Sage, Sky)
- **Export** — Download your scrapbook as a high-quality PNG

### 🔐 Authentication
- Register, Login, Forgot Password flows
- Session management with secure localStorage

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone or download this project
cd memoir

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder. Deploy it to any static hosting:
- **Vercel**: `npx vercel --prod`
- **Netlify**: Drop the `dist/` folder
- **GitHub Pages**: Use the `dist/` folder
- **Any web server**: Serve the `dist/` folder

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router DOM v6 | Client-side routing |
| Vite 5 | Build tool & dev server |
| Tailwind CSS 3 | Utility-first styling |
| Framer Motion | Animations & transitions |
| Lucide React | Icons |
| html2canvas | Canvas export to PNG |
| JSZip | Parsing WhatsApp .zip exports |
| localStorage | Data persistence (swap for any backend) |

---

## 📁 Project Structure

```
memoir/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Router & layout
    ├── index.css             # Global styles & Tailwind
    ├── context/
    │   └── AuthContext.jsx    # Authentication state
    ├── lib/
    │   ├── storage.js        # localStorage abstraction layer
    │   ├── whatsapp-parser.js # WhatsApp export parser
    │   └── utils.js          # Utility functions
    ├── components/
    │   ├── Layout.jsx        # App shell with nav
    │   └── ProtectedRoute.jsx # Auth guard
    └── pages/
        ├── Login.jsx         # Login page
        ├── Register.jsx      # Registration page
        ├── ForgotPassword.jsx # Password reset
        ├── Home.jsx          # Chat list & import
        ├── ChatView.jsx      # Conversation view
        ├── Starred.jsx       # Starred messages
        ├── Scrapbooks.jsx    # Scrapbook management
        └── Canvas.jsx        # Canvas editor (main feature)
```

---

## 🔄 Adding a Real Backend

This MVP uses `localStorage` for data persistence. The `src/lib/storage.js` file serves as an abstraction layer — replace those functions with API calls to connect to any backend:

- **Supabase** — Drop-in PostgreSQL + auth + storage
- **Firebase** — Google's BaaS with Firestore
- **Custom API** — Express.js, FastAPI, Django, etc.
- **Base44** — If you want to go back to Base44 but with your own code

The functions to replace are in `src/lib/storage.js`:
- `getItem` / `setItem` → API calls
- `saveFile` / `getFile` → Cloud storage (S3, Supabase Storage, etc.)
- `getCurrentUser` / `setCurrentUser` → JWT/session management

---

## 📱 How to Export WhatsApp Chats

1. Open WhatsApp on your phone
2. Open the chat you want to export
3. Tap the three dots → **More** → **Export chat**
4. Choose **Include media** (for a `.zip`) or **Without media** (for a `.txt`)
5. Save or share the file
6. Upload it in Memoir!

---

## 📄 License

This project is yours to own and modify freely.
