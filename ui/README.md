# ⚛️ Movies Tracker — Next.js 16 Frontend App

This directory contains the modern, responsive web frontend for **Movies Tracker**, built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS v4**, and **Shadcn UI**.

---

## ✨ Features & UI Highlights

- **Dynamic TitleCard Timer (`/timer`)**: Features infinite scroll pagination (`IntersectionObserver`) with smooth loading states, allowing users to browse hundreds of movies without lag.
- **Annual Leaderboard (`/leaderboard`)**: Real-time rankings comparing total runtime seconds watched across the current year (`2026`).
- **Accessible Watch Logging (`AddWatchDialog`)**: Clean modal interface with native, reliable HTML5 date pickers, instant theater matching, and optional ticket stub screenshot upload.
- **Admin Dashboard (`/admin`)**: Dedicated control center for approving community theater submissions, resolving user admin requests, and paginated movie catalog management.
- **Firebase Google OAuth**: Seamless, one-click authentication (`signInWithPopup`) handled via custom React context (`AuthContext`).

---

## 🛠️ Local Development Setup

### 1. Install Node Dependencies
```bash
cd ui
npm install
```

### 2. Configure Environment Variables (`ui/.env.local`)
Create a `.env.local` file inside the `ui/` directory with your Firebase configuration and local API URL:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

> ⚠️ **Production URL**: In production (Vercel), `NEXT_PUBLIC_API_URL` **must** be set to `/api` so that `vercel.json` proxies API calls directly to the Python backend.

### 3. Start Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to browse the app.

---

## 🧪 Verification & Build Checks

Before committing or deploying, verify TypeScript type safety and Next.js production bundling:

```bash
# Check TypeScript types across the entire UI codebase:
npx tsc --noEmit

# Test production build locally:
npm run build
```

---

## 📁 Directory Structure
```
ui/
├── app/                  # Next.js App Router Pages
│   ├── page.tsx          # Landing & Hero Page
│   ├── auth/             # Google OAuth Login Page
│   ├── timer/            # Movie Catalog & TitleCard Timer
│   ├── leaderboard/      # Annual Runtime Leaderboard
│   └── admin/            # Admin Control Center
├── components/           # Reusable Shadcn UI & Custom Components
│   ├── add-watch-dialog.tsx  # Watch History Modal
│   ├── movie-grid.tsx        # Infinite Scroll Movie Grid
│   ├── header.tsx            # Navigation Bar
│   └── ui/                   # Shadcn UI primitives
├── contexts/             # React Context Providers (`AuthContext`)
├── lib/                  # TypeScript Types & Utilities (`types.ts`)
└── services/             # API Client Layer (`api.ts`, `user-service.ts`)
```