<div align="center">
  <img src="/public/cosmosupgrades.png" alt="Cosmos Upgrades Logo" width="300" />
  <h1>Cosmos Upgrades UI</h1>
  <p><strong>Never miss another blockchain upgrade in the Cosmos ecosystem!</strong></p>
</div>

## 🌌 Mission Control for Cosmos Network Upgrades

**Cosmos Upgrades UI** is your real-time dashboard for tracking and managing upgrades across the entire Cosmos ecosystem. This modern web application ensures validators, developers, and token holders stay informed about critical blockchain upgrade events, helping to maintain network stability and coordination.

Built with the latest web technologies and a sleek, user-friendly interface, Cosmos Upgrades UI bridges the gap between complex blockchain infrastructure and the people who depend on it.

## ✨ Features

- **Real-time Upgrade Tracking**: Monitor upcoming upgrades across all Cosmos-based networks
- **Chain Status Dashboard**: At-a-glance view of mainnet and testnet chains with upgrade status
- **Cosmovisor Support**: Direct links to cosmovisor binaries for automated upgrades
- **Personalized Watchlist**: Save your favorite chains for easy monitoring
- **Webhook Notifications**: Configure Discord/Slack alerts for upcoming upgrades
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile devices
- **Wallet Integration**: Connect with popular Cosmos wallets (Keplr, Leap, etc.)

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- No external database — user data lives in a bundled SQLite file via Prisma.

### Installation

1. Clone and install:
```bash
git clone https://github.com/bryanlabs/cosmos-upgrades-ui.git
cd cosmos-upgrades-ui
npm install
```

2. Copy `.env.example` to `.env.local` and fill it in (see Environment variables). Minimum for local dev:
```
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="<openssl rand -base64 32>"
COSMOS_UPGRADES_API_BASE_URL="http://localhost:8080"   # or the public API
```

3. Generate the Prisma client and run (the SQLite schema is created automatically at runtime):
```bash
npx prisma generate
npm run dev
```

## 🏗️ Architecture

This project uses:

- **Next.js 15 / React 19**: Full-stack React framework with server components
- **TanStack Query**: Data fetching and caching
- **Prisma + SQLite**: User data, favorites, and webhook alerts (a single-file DB)
- **NextAuth (Auth.js)**: Sessions via Authentik (Apple/Google) and Sign-In With Cosmos (Keplr/Leap)
- **shadcn/ui + Tailwind v4**: Component system built on Radix UI
- **Docker**: Standalone Next.js server image

## 🔐 Authentication

Two ways to sign in, both producing a NextAuth (JWT) session:

- **Apple / Google** via Authentik (OIDC). Requires the `AUTH_AUTHENTIK_*` env.
- **Cosmos wallet (Keplr / Leap)** via Sign-In With Cosmos: the browser signs a
  server-issued nonce (ADR-036), the server verifies the secp256k1 signature and
  derives the address (`lib/cosmos-auth.ts`), and a NextAuth Credentials provider
  mints the session. No wallet SDK ships to the browser — `graz` was removed.

## 🔔 Notifications

Alerts are sent server-side, not from the browser. A Kubernetes CronJob
(`notification-dispatch`, every 5 min) POSTs to `/api/notifications/dispatch`
with a bearer token; that route reads saved webhooks from SQLite, decides what to
fire (per chain, trigger, and lead time), de-duplicates, and sends to the user's
Discord/Slack/Telegram URL. Webhook URLs are encrypted at rest (AES-256-GCM,
`WEBHOOK_ENCRYPTION_KEY`).

## ⚙️ Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite path, e.g. `file:/data/cosmos-upgrades-ui.db`. |
| `COSMOS_UPGRADES_API_BASE_URL` | Base URL of the upgrades API the UI proxies to. |
| `AUTH_SECRET` | NextAuth signing secret (`openssl rand -base64 32`). |
| `AUTH_AUTHENTIK_ISSUER` / `_ID` / `_SECRET` | Authentik OIDC (Apple/Google). Optional — wallet login works without it. |
| `NOTIFICATION_DISPATCH_TOKEN` | Bearer token the dispatch CronJob presents. |
| `WEBHOOK_ENCRYPTION_KEY` | base64 32-byte AES key encrypting webhook URLs at rest. |
| `NEXT_PUBLIC_AUTHENTIK_END_SESSION_URL` | Authentik logout URL (build-time). |

## 🐳 Docker Deployment

```bash
# Build the Docker image
docker build -t cosmos-upgrades-ui .

# Run the container
docker run -p 3000:3000 -e DATABASE_URL=your_connection_string -e NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id cosmos-upgrades-ui
```

## 📊 API Integration

The UI consumes data from the [Cosmos Upgrades API](https://cosmos-upgrades.bryanlabs.net/), which continuously monitors chains for upgrade proposals.

---

<div align="center">
  <p>Built with ❤️ by BryanLabs</p>
  <a href="https://bryanlabs.net">
    <img src="/public/bryanlabs_banner.png" alt="BryanLabs" width="200" />
  </a>
</div>
