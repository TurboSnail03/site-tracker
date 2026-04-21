# 📊 Site Tracker — Construction Expense Dashboard

A premium, mobile-first SaaS dashboard for real-time construction expense tracking. Built with a modern Navy/Cool-Gray design system, animated data visualizations, and full PWA support for on-site use.

## ✨ Features

- **Premium SaaS UI** — Navy/Cool-Gray design system with glassmorphism, smooth micro-animations, and Framer Motion transitions.
- **Interactive Data Visualizations** — Area charts, bar charts, and sparklines powered by Recharts.
- **PWA Ready** — Installable on iOS and Android via `vite-plugin-pwa` for a native app experience.
- **Frictionless Logging** — One-tap transaction entry directly from material cards.
- **Smart Search & Filter** — Instantly find transactions by material name or vendor.
- **Cloud-Free Backup** — Drag-and-drop JSON export/import for cross-device data portability.
- **Mobile Native Polish** — Haptic feedback, anti-zoom inputs, and safe-area awareness for modern smartphones.
- **Dark Mode First** — Eye-friendly dark theme optimized for outdoor and low-light environments.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 5 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| PWA | vite-plugin-pwa |
| Persistence | Browser LocalStorage + JSON Export |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

Deploy the `/dist` folder to any static host:

- **Vercel** — `vercel deploy`
- **Netlify** — Drag and drop `/dist` into the Netlify dashboard
- **GitHub Pages** — Push `/dist` contents to the `gh-pages` branch

## 📁 Project Structure

```
site-tracker/
├── public/          # Static assets & PWA icons
├── src/
│   ├── App.jsx      # Root component & state management
│   ├── DashboardTab.jsx    # Analytics & chart views
│   ├── TransactionModal.jsx # Add/edit transaction modal
│   └── index.css    # Global styles & Tailwind v4 tokens
├── index.html
└── vite.config.js
```