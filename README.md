# ☘️ Clovifi — Personal Finance Tracker

A Frutiger Aero–inspired personal finance tracker featuring real-time stock ticker feeds, interactive DVD screensaver visualizer, PostgreSQL ledger partitioning, and Firebase Authentication & Hosting.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vite-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/backend-Express%20%7C%20PostgreSQL-blue.svg)]()
[![Firebase](https://img.shields.io/badge/firebase-Auth%20%7C%20Hosting-orange.svg)]()

---

## ✨ Features

- **☘️ Frutiger Aero Aesthetics**: Glassmorphic frosted panels, specular edge reflections, synthesized ambient water sound effects, and organic emerald accents.
- **☘️ DVD Screensaver Visualizer**: Dynamic 3-petal clover bouncing visualizer on the landing page with neon motion trails, reactive wall bounces, and Zen mode.
- **🔒 Dedicated Database Isolation**: Each user who signs up or logs in accesses their own isolated database partition in PostgreSQL for accounts, transactions, and categories.
- **📈 Real-Time Stock Feed**: Live stock ticker widget displaying price quotes and daily deltas for major tickers (AAPL, NVDA, MSFT, GOOGL, AMZN).
- **🔥 Firebase Cloud Authentication**: Seamless support for Google 1-Click Sign-In and Email/Password with backend session synchronization.
- **🚀 Firebase Hosting Ready**: Pre-configured `firebase.json` and `.firebaserc` for 1-step deployment.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Wouter, Radix UI, TanStack Query, Lucide Icons
- **Backend**: Node.js, Express, Drizzle ORM, PostgreSQL, bcryptjs, cookie-parser
- **Cloud & Auth**: Firebase Auth, Firebase Hosting, Google Analytics

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/HarshitFreq/Clovifi.git
cd Clovifi
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the sample environment configuration:
```bash
cp .env.example .env
```

Add your Firebase configuration keys if you wish to enable Google 1-Click Sign-In:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

### 4. Run locally
```bash
# Start backend API server (port 8080)
npm run dev --workspace=@workspace/api-server

# In a separate terminal, start frontend dev server (port 19051)
npm run dev --workspace=@workspace/finance-tracker
```

Open your browser at `http://localhost:19051/` to access the application.

---

## 🌐 Deploy to Firebase Hosting

```bash
# 1. Build the production bundle
npm run build:frontend

# 2. Deploy to Firebase Hosting
npx firebase-tools deploy --only hosting
```

---

## 📄 License
MIT © [Harshit](https://github.com/HarshitFreq)
