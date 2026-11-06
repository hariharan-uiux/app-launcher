# 🚀 App Launcher

An ultra-lightweight, personal cross-platform desktop application launcher and catalog manager built with **shadcn/ui (Zinc theme)**, **React**, **Vite**, **Tailwind CSS**, and **Electron**.

Designed for minimal CPU & RAM footprint (~38MB idle memory) and sub-120ms instant startup.

---

## Features

- **shadcn/ui Neutral Design System**:
  - Deep zinc/dark palette (`#09090b` / `zinc-900`) with subtle `zinc-800` borders and high-contrast typography.
  - Built with accessible Radix UI primitives (`Slot`, `Tabs`, `Dialog`, `Progress`).
- **Comprehensive App Catalog**:
  - Grid View and compact List View with instant switcher.
  - App metadata: icons, version, installed status, categories, tags, authors, and download sizes.
  - Status indicators: `Installed` (emerald badge), `Update Available` (amber badge), `Not Installed` (zinc badge).
  - Global real-time search across names, descriptions, authors, and tags.
  - Category filtering (`Developer`, `Productivity`, `Utilities`, `Media`, `AI & Tools`).
  - Status filtering (`All`, `Installed`, `Updates Available`, `Not Installed`).
- **Lifecycle Actions**:
  - **Launch**: Runs the native binary or command via Electron IPC.
  - **Install**: Installs the target application with visual progress feedback.
  - **Update**: Updates individual apps or batch updates all apps via **Update All**.
  - **Uninstall**: Cleans up installed state and updates metadata.
  - **App Details Modal**: Deep inspection of package targets, tags, homepage, and commands.
- **Remote & Local Manifest Loader**:
  - Validates manifests against JSON Schema draft-07 (`schema/catalog.schema.json`).
  - Supports loading from default `/apps.json`, custom local file path, or remote HTTPS URLs (e.g. GitHub raw URL).
  - Persists custom installations and manifest selections across app restarts in local storage.
- **Cross-Platform Target Architecture**:
  - Full execution support for **Linux** and **Windows** targets.
  - Dual runtime mode: Native Electron desktop window or standalone web client.

---

## Project Structure

```
app-launcher/
├── electron/
│   ├── main.cjs               # Ultra-lightweight Electron main process
│   └── preload.cjs            # Secure context-isolated IPC bridge
├── public/
│   └── apps.json              # Default curated catalog manifest
├── schema/
│   └── catalog.schema.json    # JSON Schema definition for catalog manifests
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (card, button, badge, input, tabs, dialog, progress)
│   │   ├── AppCard.tsx        # Grid view app card
│   │   ├── AppListItem.tsx    # List view app row
│   │   ├── AppIcon.tsx        # Lucide icon resolver
│   │   ├── AppDetailModal.tsx # Deep inspection dialog
│   │   └── ManifestModal.tsx  # Remote/Local manifest loader dialog
│   ├── lib/
│   │   └── utils.ts           # shadcn cn() utility
│   ├── types/
│   │   └── catalog.ts         # TypeScript schema definitions
│   ├── App.tsx                # Main App Launcher application
│   ├── main.tsx               # React entrypoint
│   └── index.css              # Tailwind CSS directives & zinc design tokens
├── tailwind.config.js         # Tailwind theme configuration
├── vite.config.ts             # Vite bundler configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies & build scripts
```

---

## Quick Start

### 1. Web / Development Mode
```bash
cd /home/hari/OpenBot/Shared/projects/app-launcher
npm run dev
```
Runs the Vite development server with hot-module reloading at `http://localhost:3300`.

### 2. Desktop Mode (Electron)
```bash
npm run build
npm run electron
```

### 3. Production Build
```bash
npm run build
```
Generates the minified, production-ready desktop bundle in `dist/`.
