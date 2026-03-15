# ▌▌ PresentPDF

**A local-first PDF presentation tool.**

Upload a PDF → get a dual-window presenter with a fullscreen view and a controller — all running 100% in your browser.

[![Next.js](https://img.shields.io/badge/Next.js_16-000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=fff)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-EBFF00?style=for-the-badge)]()

</div>

---

## ⚡ What is PresentPDF?

PresentPDF turns any PDF into a full-screen, keyboard-navigable presentation — with a separate **control panel** for the presenter and a **present view** for the audience. No file uploads to a server; everything stays in the browser using IndexedDB.

<br>

## ✦ Features

| Feature | Description |
|---|---|
| **Drag & Drop Upload** | Land on the homepage, drop a PDF, and you're in |
| **Dual-Window Mode** | Open `/present` on the projector and `/control` on your laptop — they stay in sync |
| **Smart Background** | The present view samples the PDF's edge colors and adapts the page background to match |
| **Keyboard Navigation** | Arrow keys navigate slides from either window |
| **Local-Only Storage** | PDFs are stored in the browser via `localforage` / IndexedDB — nothing leaves your machine |
| **High-Fidelity Rendering** | 2× supersampled canvas rendering via `react-pdf` for crisp text and vectors |
| **Pre-Rendering** | Pages around the current slide are rendered ahead of time for instant transitions |

<br>

## 🏗 Architecture

```
┌────────────────────────────────────────────────────┐
│                   Browser (Same Origin)            │
│                                                    │
│  ┌──────────┐   BroadcastChannel   ┌────────────┐  │
│  │ /control │ ◄──────────────────► │  /present  │  │
│  │ (laptop) │    slide sync        │ (projector)│  │
│  └────┬─────┘                      └─────┬──────┘  │
│       │                                  │         │
│       └──────────┐   ┌──────────────────┘          │
│                  ▼   ▼                             │
│             ┌──────────────┐                       │
│             │  IndexedDB   │                       │
│             │ (localforage)│                       │
│             └──────────────┘                       │
└────────────────────────────────────────────────────┘
```

### Routes

| Route | Purpose |
|---|---|
| `/` | Landing page — drag-and-drop PDF upload |
| `/control?id=<uuid>` | Presenter control panel with live preview, slide counter, and navigation |
| `/present?id=<uuid>` | Fullscreen audience view with adaptive background |

<br>

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 9

### Install & Run (Development)

```bash
# Clone the repo
git clone https://github.com/iamcoder18/PresentPDF
cd PresentPDF

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and drop a PDF.

### Production Build

```bash
npm run build
npm start
```

<br>

## 🐳 Docker

### Quick Start

```bash
# Build and run with Docker Compose
docker compose up --build

# Or build the image directly
docker build -t presentpdf .
docker run -p 3000:3000 presentpdf
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Docker Compose

The included `docker-compose.yml` provides:

- Port mapping (`3000:3000`)
- Health check (auto-restarts if unhealthy)
- `restart: unless-stopped` policy

```bash
# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

<br>

## 📁 Project Structure

```
PresentPDF/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (upload)
│   │   ├── layout.tsx            # Root layout (Space Mono font)
│   │   ├── globals.css           # Tailwind + brutalist theme tokens
│   │   ├── control/page.tsx      # Presenter control panel
│   │   └── present/page.tsx      # Fullscreen presentation view
│   ├── components/
│   │   ├── pdf/PDFViewer.tsx     # Core PDF renderer (react-pdf)
│   │   └── ui/button.tsx         # Shadcn button component
│   ├── hooks/
│   │   └── useSyncState.ts       # BroadcastChannel sync hook
│   └── lib/
│       ├── storage.ts            # localforage PDF persistence
│       └── utils.ts              # Utility helpers
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yml            # Compose orchestration
├── .dockerignore                 # Build context exclusions
├── next.config.ts                # Next.js config (standalone output)
├── package.json
└── tsconfig.json
```

<br>

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) |
| PDF Engine | [react-pdf](https://github.com/wojtekmaj/react-pdf) + pdf.js |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + [Shadcn UI](https://ui.shadcn.com) |
| Storage | [localforage](https://localforage.github.io/localForage/) (IndexedDB) |
| Cross-Tab Sync | [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) |
| Font | [Space Mono](https://fonts.google.com/specimen/Space+Mono) (Google Fonts) |

<br>

## 📄 License

MIT
