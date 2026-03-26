# PocketLedger

**Mobile-first expense & mileage tracker for Basic ITS**

A Progressive Web App (PWA) designed for fast, on-the-go expense logging and mileage tracking. Installable on both Android and iOS with a home screen icon for instant access.

## Features

- **Receipt Photo Capture** — Snap or upload receipt photos directly from your phone
- **Customizable Expense Categories** — Configure categories like Fuel, Vehicle Maintenance, Tool Purchase, Job Expense, etc.
- **Vehicle Tracking** — Associate expenses with specific vehicles, track odometer readings
- **Mileage Log** — Daily/weekly mileage entries with automatic calculation
- **Professional PDF Reports** — Generate branded PDF reports with company logo for:
  - Individual expense receipts (with receipt photo embedded)
  - Expense reports by date range
  - Mileage logs by date range
  - Combined reports (expenses + mileage)
- **Email Integration** — Send receipts via configurable email presets using your phone's email app
- **History & Archive** — Browse all expenses and mileage entries with preset date range filters (This Week, Last 7 Days, This Month, This Quarter, This Year)
- **PIN-Protected Admin** — Full admin backend secured with a configurable PIN:
  - Manage expense categories and workflow (what follow-up questions to ask)
  - Manage vehicles (make, model, year, plate, mileage tracking toggle)
  - Configure email presets and default subjects
  - App settings (home page, company name, PIN change)
- **Installable PWA** — Works offline, installable on Android & iOS home screens
- **Docker Ready** — Single container deployment with Docker Compose

## Quick Start (Docker)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/neilyboy/basicits-expense-mileage.git
   cd basicits-expense-mileage
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env to set your admin PIN and other options
   ```

3. **Start with Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

4. **Access the app:**
   Open `http://your-server-ip:3000` on your phone's browser. Tap "Add to Home Screen" to install.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `ADMIN_PIN` | `1234` | PIN to access admin panel |
| `APP_URL` | `http://localhost:3000` | Public URL of the app |
| `COMPANY_NAME` | `Basic ITS` | Company name shown in reports |

## Development

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start server (terminal 1)
cd server && PORT=3005 node index.js

# Start client dev server (terminal 2)
cd client && npx vite

# Build client for production
cd client && npm run build
```

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, Lucide Icons, jsPDF, date-fns
- **Backend:** Node.js, Express, better-sqlite3
- **PWA:** vite-plugin-pwa with Workbox
- **Deployment:** Docker with multi-stage build

## Project Structure

```
├── docker-compose.yml      # Docker Compose config
├── Dockerfile              # Multi-stage build (client + server)
├── .env.example            # Environment variable template
├── logo.svg                # Company logo (white, for dark backgrounds)
├── server/
│   ├── index.js            # Express API server
│   ├── db.js               # SQLite database setup & seeding
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx         # Main app with routing
│   │   ├── api.js          # API client
│   │   ├── pages/          # All page components
│   │   ├── components/     # Shared components
│   │   └── utils/pdf.js    # PDF generation
│   ├── public/             # Static assets & PWA icons
│   ├── vite.config.js      # Vite + PWA config
│   └── package.json
├── data/                   # SQLite database (auto-created, gitignored)
└── uploads/                # Receipt photos (auto-created, gitignored)
```

## Usage

1. **First time:** Open the app → tap Admin → enter PIN (default: `1234`) → add your vehicles and configure categories
2. **Log an expense:** Home → New Expense → Take/skip photo → Select category → Select vehicle (if applicable) → Enter details → Submit
3. **Log mileage:** Home → Mileage Log → Select vehicle → Enter start/end odometer → Save
4. **View history:** History tab → Filter by date range → Export PDF
5. **Email a receipt:** History → Tap an expense → Download PDF or Email Receipt

---

*Built for Basic ITS by PocketLedger*
