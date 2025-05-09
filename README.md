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
- npm or yarn
- PostgreSQL (for user data and favorites)

### Installation

1. Clone the repository
```bash
git clone https://github.com/bryanlabs/cosmos-upgrades-ui.git
cd cosmos-upgrades-ui
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```
DATABASE_URL="postgresql://username:password@localhost:5432/cosmosupgrades"
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your_wallet_connect_project_id"
```

4. Initialize the database
```bash
npx prisma db push
```

5. Start the development server
```bash
npm run dev
```

## 🏗️ Architecture

This project uses:

- **Next.js 14**: Full-stack React framework with server components
- **TanStack Query**: Data fetching and state management
- **Prisma**: Database ORM for PostgreSQL
- **graz**: Cosmos wallet connection library
- **shadcn/ui**: Component system built on Radix UI and Tailwind CSS
- **Docker**: Containerization for easy deployment

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
