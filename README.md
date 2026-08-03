# PasteTimeline — macOS & Web Clipboard History Manager

**PasteTimeline** is a local-first, privacy-focused macOS and Web clipboard manager. It captures, organizes, and searches your clipboard history with smart content type detection, OCR image text extraction, custom folder collections, sensitive credential masking, and hotkey support (`Cmd+Shift+V`).

---

## ✨ Key Features

- 📜 **Infinite Clipboard Timeline**: Automatically records copied text, formatted code, URLs, colors, images, and file paths.
- 🍎 **macOS Desktop App Ready**: Runs as a native desktop app on Apple Silicon (M1/M2/M3/M4) or Intel Macs, complete with a macOS Menu Bar Tray icon and global hotkey support.
- ⚡ **1-Click macOS Dock Install (PWA)**: Install directly into your macOS Dock and Applications folder from Safari ("Add to Dock") or Chrome/Edge without extra build tools.
- 🔍 **Instant Search & Regex**: Search copied clips instantly by keyword, content type, application source, tags, or regular expressions.
- 🖼️ **Client-Side OCR**: Extract text directly from copied or uploaded images using pure browser Canvas OCR analysis.
- 📂 **Custom Collections & Folders**: Organize your clipboard clips into folders (e.g. *Project Alpha*, *Auth Snippets*).
- 🔒 **Privacy & Security Guard**: Auto-masks sensitive passwords, 6-digit 2FA/OTP codes, and credit card numbers (Luhn check), with support for excluding private apps (like 1Password or Bitwarden).
- ⌨️ **Quick Paste Overlay (`Cmd+Shift+V`)**: Floating overlay for fast keyboard-driven copying.
- 📊 **Clipboard Analytics**: View copy frequency metrics, top source applications, and content breakdown.
- 🌗 **Light & Dark Theme**: Fully responsive design supporting system theme preferences with polished typography.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation & Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pastetimeline.git
   cd pastetimeline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🍏 Installing as a macOS App

### Method 1: 1-Click Installation (Safari / Chrome / Edge)
1. **Safari (macOS Sonoma or later)**: Open `http://localhost:3000` (or your deployed URL), click **File → Add to Dock** in the macOS menu bar.
2. **Chrome / Edge / Brave**: Click the **Install (+)** icon in the address bar or select **Menu (⋮) → Cast, save and share → Install PasteTimeline**.

### Method 2: Native Electron DMG Build
To compile a native `.dmg` installer or standalone `.app` bundle for Apple Silicon and Intel Macs:

```bash
# Build Vite production assets and package Electron DMG
npm run build:mac
```

The output DMG installer will be created inside the `dist/` directory.

---

## 🔄 How App Updates Work

### Web & PWA Updates
PasteTimeline incorporates an automated Service Worker (`/public/sw.js`). When a new version is deployed:
1. The Service Worker detects the updated build assets in the background.
2. An **"Update Available"** toast banner automatically pops up at the top of the interface.
3. Clicking **"Update Now"** reloads the app seamlessly without losing local storage history.

### macOS Native Desktop App Updates
The Electron main process integrates `electron-updater`. Pushed release builds automatically download in the background and notify the user to restart to apply the update.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand with `localStorage` persistence
- **Icons**: Lucide React
- **Desktop Runtime**: Electron (`electron/main.js` & `electron/preload.js`)
- **PWA Capabilities**: Service Worker & Web App Manifest

---

## 📄 License

MIT License. Feel free to customize and use for personal or commercial projects.
