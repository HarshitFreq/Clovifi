# ☘️ Clovifi — Personal Finance Tracker

A nostalgic 2000s era Frutiger Aero–themed personal finance website featuring interactive visualizers, real-time market feeds, dual-ledger architecture (Local Storage + Cloud PostgreSQL), and Firebase Authentication & Hosting.

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg?style=for-the-badge&logo=firebase)](https://clovifi-11.web.app)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vite-61DAFB.svg?style=for-the-badge&logo=react)](artifacts/finance-tracker)
[![Backend](https://img.shields.io/badge/backend-Express%20%7C%20PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql)](artifacts/api-server)

---

## 🌐 Live Application

Explore the live application deployed on Firebase Hosting:
👉 **[https://clovifi-11.web.app](https://clovifi-11.web.app)**

> **Tip:** You can enter immediately using **Guest / Demo Mode** from the landing page without signing up, or sign in using **Google 1-Click** / Email via Firebase Authentication.

---

## 🍀 About Clovifi

**Clovifi** is an open-source, privacy-first personal finance tracker styled as a nostalgic 2000s era website with the iconic, tactile aesthetic of the **Frutiger Aero** era (circa 2004–2013).

### Why Clovifi?
Conventional personal finance tools suffer from two extremes: they are either sterile, monochrome spreadsheets or subscription-gated trackers cluttered with intrusive ads, third-party trackers, and complex paywalls.

Clovifi was created to provide a nostalgic, fast, and privacy-respecting alternative:
- **Zero-Friction & Offline-First**: Your financial records belong to you. Clovifi works immediately in **Guest Mode** powered by a client-side local ledger engine (`localStorage`). You can track accounts, transactions, and recurring subscriptions completely offline with zero setup and no server dependencies.
- **Seamless Cloud Backup**: For cross-device continuity, sign in with **Google 1-Click** or Email via **Firebase Authentication** and sync with isolated PostgreSQL ledger partitions.
- **Frutiger Aero Aesthetics**: Bringing joy back to personal finance with frosted glassmorphism, glossy organic emerald accents, interactive canvas screensaver visualizers, and synthesized ambient water micro-interactions.
- **Executive Financial Clarity**: Live calculation of your net worth, savings rate, recurring bills, category spending breakdowns, and live market quotes without nested menu clutter.

---

## ✨ Key Features

### ☘️ Frutiger Aero Aesthetics & Experience
- **Nostalgic Skeuomorphic & Aero Polish**: Glossy glassmorphic panels, specular edge highlights, organic emerald gradients, and synthesized ambient water sound effects.
- **Interactive Clover DVD Screensaver**: 3-petal neon clover bouncing visualizer on the landing page with dynamic trajectory trails, wall collision physics, and an interactive Zen mode.
- **Theme Personalization**: Multiple aero-inspired color themes (Emerald, Sapphire, etc.) with real-time CSS variable switching.

### 📊 Executive Financial Dashboard
- **Net Worth & Cash Flow Summary**: Instant calculation of total net worth, monthly income, monthly expenses, and net savings rate.
- **Account Ledger Overview**: Multi-account tracking across Checking, Savings, Credit Cards, and Investment accounts with real-time balance aggregation.
- **Time-Horizon Filtering**: Effortlessly filter metrics and ledger entries by **This Week**, **This Month**, **This Quarter**, or **This Year**.
- **Quick Action Bar**: Fast access to `+ New Transaction`, `Add Account`, `Export CSV`, and `Print Report`.

### 💳 Ledger, Transactions & Subscriptions
- **Granular Transaction Management**: Log, edit, filter, and delete transactions with custom categories, payment methods, transaction dates, and notes.
- **Recurring Subscriptions Tracker**: Track active recurring services, projected monthly billing totals, and upcoming renewal deadlines.
- **Visual Analytics & Breakdown**: Category expense distributions with interactive charts (powered by Recharts), spending velocity indicators, and tooltips.

### 📈 Real-Time Stock Feed
- **Live Market Ticker**: Integrated market widget displaying streaming stock quotes and daily deltas for major tickers (`AAPL`, `NVDA`, `MSFT`, `GOOGL`, `AMZN`).

### 🛡️ Dual-Storage Architecture & Privacy Controls
- **Client-Side Local Ledger**: Zero-friction, offline-first Guest Mode powered by `localLedger` in `localStorage`. Operates standalone without requiring a database connection.
- **Cloud PostgreSQL & Express Ledger**: Multi-tenant database partitioning with isolated accounts and secure authentication for registered users.
- **Complete Data Control**:
  - **Clear All Data**: Cleanly wipes all accounts, transactions, and categories down to `₹0.00` without auto-reseeding.
  - **Load Sample Data**: Re-seeds a rich, realistic sample financial portfolio at any time for testing or demonstration.
  - **Export CSV & Print Reports**: Export full transaction history to CSV or generate clean printable financial summaries.

---

## 🛠️ Tech Stack

| Area | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Wouter (Router), Radix UI primitives, Lucide Icons |
| **State & Data Fetching** | TanStack Query v5, Local Storage Engine (`localLedger`), Orval OpenAPI client |
| **Data Visualization** | Recharts, Custom Canvas Particle & Screensaver Physics Engine |
| **Backend API** | Node.js, Express, Drizzle ORM, PostgreSQL, bcryptjs, cookie-parser |
| **Cloud & Deployment** | Firebase Authentication (Google 1-Click + Email/Password), Firebase Hosting |

---

## 📁 Repository Structure

```text
Clovifi/
├── artifacts/
│   ├── finance-tracker/       # React 19 + Vite frontend application
│   │   ├── src/
│   │   │   ├── components/    # Navigation, Modals, Clover Screensaver, Stock Feed
│   │   │   ├── lib/           # localLedger, Firebase Auth, Audio synthesis, Utils
│   │   │   ├── pages/         # Landing, Dashboard, Accounts, Transactions, Subscriptions, Settings
│   │   │   └── App.tsx        # Application shell, routing & query client setup
│   │   └── vite.config.ts     # Vite configuration
│   └── api-server/            # Express + Drizzle ORM backend API server
│       ├── src/               # Auth routes, ledger routes, PostgreSQL schema & migrations
│       └── dist/              # Compiled backend bundle
├── lib/
│   ├── api-client-react/      # Generated typed React Query hooks
│   └── api-spec/              # OpenAPI 3.0 API specifications
├── firebase.json              # Firebase Hosting configuration & SPA rewrites
├── .firebaserc                # Firebase target project mapping (`clovifi-11`)
└── README.md                  # Project documentation
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v20+ and **npm** v10+
- *(Optional)* PostgreSQL instance (if running the backend API server locally)

### 2. Clone the Repository
```bash
git clone https://github.com/HarshitFreq/Clovifi.git
cd Clovifi
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root or inside `artifacts/finance-tracker`:
```bash
cp .env.example .env
```

Add your Firebase configuration keys to enable Firebase Authentication:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

### 5. Run Locally

#### Option A: Frontend Standalone (Guest / Demo Mode)
The frontend includes a full client-side ledger engine that works right away without needing a database:
```bash
npm run dev --workspace=@workspace/finance-tracker
```
Open [http://localhost:19051](http://localhost:19051) in your browser.

#### Option B: Full Stack (Frontend + Backend API + PostgreSQL)
```bash
# Terminal 1: Start the backend API server (port 8080)
DATABASE_URL="postgresql://localhost/aerofinance" npm run dev --workspace=@workspace/api-server

# Terminal 2: Start the frontend Vite development server (port 19051)
npm run dev --workspace=@workspace/finance-tracker
```

---

## 🌐 Deploy to Firebase Hosting

To build and deploy the production bundle to Firebase Hosting:

```bash
# Build the frontend and deploy in one command:
npm run deploy:firebase
```

Or step-by-step:
```bash
# 1. Typecheck & build the production bundle
npm run typecheck
npm run build:frontend

# 2. Deploy to Firebase Hosting
npx --yes firebase-tools deploy --only hosting
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run build:frontend` | Compiles and optimizes the React frontend into `artifacts/finance-tracker/dist/public` |
| `npm run typecheck` | Runs TypeScript type checking across all workspaces and packages |
| `npm run deploy:firebase` | Builds the frontend and deploys hosting artifacts to Firebase |
| `npm run dev --workspace=@workspace/finance-tracker` | Starts the Vite frontend dev server at `http://localhost:19051` |
| `npm run dev --workspace=@workspace/api-server` | Starts the Express API backend server at `http://localhost:8080` |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Developed with ☘️ by [Harshit](https://github.com/HarshitFreq).
