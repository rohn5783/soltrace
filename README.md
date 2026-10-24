# Soltrace — Full-Stack Solana Block Explorer (MERN Stack)

**Soltrace** is a high-performance, full-stack Solana block explorer built using the **MERN stack** (MongoDB, Express, React 19, Node.js) and the **Solana blockchain** via `@solana/web3.js` and `@solana/spl-token`.

---

## Architecture Overview

```
                                      ┌────────────────────────────────────────┐
                                      │           Solana Blockchain            │
                                      │  (Mainnet-Beta / Devnet / Testnet RPC) │
                                      └───────────────────▲────────────────────┘
                                                          │
                                                @solana/web3.js / RPC
                                                          │
┌────────────────────────────────┐            ┌───────────▼────────────────────┐
│      Frontend (React 19)       │  REST API  │       Backend (Express.js)     │
│   • Tailwind CSS (Cyber Dark)  │◄──────────►│   • Solana RPC Manager         │
│   • Live WebSocket Streams     │            │   • CoinGecko & Jupiter Prices │
│   • Universal Search (Ctrl+K)  │ Socket.io  │   • In-Memory / Mongo Cache    │
│   • Interactive Recharts TPS   │◄──────────►│   • Real-Time Block Streamer   │
└────────────────────────────────┘            └───────────────────▲────────────┘
                                                                  │
                                                               Mongoose
                                                                  │
                                                      ┌───────────▼────────────┐
                                                      │    MongoDB Database    │
                                                      │ (Watchlists, Txs, DB)  │
                                                      └────────────────────────┘
```

---

## Key Features Implemented

### 1. Global Universal Search (`Ctrl + K`)
- **Auto-Detects**:
  - Solana Wallet / Account Public Keys (32–44 chars base58) -> `/account/:address`
  - Transaction Signatures (88 chars base58) -> `/tx/:signature`
  - SPL Token Mint Addresses -> `/token/:mint`
  - Confirmed Block Slots (e.g. `460705976`) -> `/block/:slot`
  - Token Symbols (SOL, USDC, USDT, JUP, BONK, WIF, RAY, PYTH)
- Instant autocomplete dropdown and hotkey support (`Ctrl + K`).

### 2. Live Network Ticker & Metrics
- **Real-time SOL Price** with 24h change & market capitalization.
- **Dynamic TPS Counter**: Total network TPS alongside **True (Non-Vote) TPS**.
- **Epoch Tracker**: Epoch number, slot progression bar, and countdown.
- **Cluster Switcher**: One-click toggle between **Mainnet Beta**, **Devnet**, and **Testnet**.

### 3. Confirmed Blocks Explorer (`/blocks` & `/block/:slot`)
- Real-time feed of newly confirmed blocks.
- Block slot number, Blockhash, Previous Blockhash, Parent slot, Leader validator, transaction count, reward in SOL, and block time.
- Dedicated Block detail page displaying all contained transactions with status badges.

### 4. Transactions Explorer (`/txs` & `/tx/:signature`)
- Paginated feed of confirmed transactions with filter by **All**, **Success**, and **Failed**.
- Detailed inspection:
  - Signer / Fee payer address
  - Transaction fee in SOL and USD
  - Decoded **Program Instructions** (System Program, Token Program, Jupiter, Raydium, Orca) with parsed parameters and accounts
  - **Program Execution Logs** with syntax highlighting
  - **SOL Balance Changes** (Pre vs Post balance)
  - **SPL Token Balance Changes** (Pre vs Post token amounts)
  - **Raw JSON Inspector** for developers.

### 5. Account & Wallet Portfolio Inspector (`/account/:address`)
- Native SOL balance in SOL and real-time USD valuation.
- Executable contract detection (Smart Contract program vs User wallet).
- **SPL Token Portfolio table**: lists all tokens owned with balances, prices, and USD values.
- **Transaction History**: all past activity associated with this address.
- **Mobile Wallet QR Code**: generates a scannable QR code for Phantom or Solflare wallets.

### 6. SPL Tokens Market (`/tokens` & `/token/:mint`)
- Ranked table of top Solana tokens by market cap and 24h volume.
- Token detail pages: Total supply, decimals, holders, price change, and **Security Authorities** (Mint Authority & Freeze Authority revocation status).
- **Top Token Holders Distribution**: breakdown of whale accounts and liquidity pool vaults.

### 7. Network Telemetry & Analytics (`/analytics`)
- 24-hour historical TPS interactive area chart.
- TPS Execution Composition (Vote consensus transactions vs Smart contract executions).
- Validator decentralization statistics, Nakamoto coefficient, and staked supply.

### 8. Watchlist & Bookmarks (`/watchlist`)
- Save favorite wallets, SPL tokens, or notable transactions.
- Syncs seamlessly between MongoDB and browser local storage.

---

## Directory Structure

```
solscanio/
├── package.json                 # Monorepo scripts & runner
├── start.js                     # Concurrent server launcher
├── backend/                     # Express & Node.js API server
│   ├── package.json
│   ├── .env.example             # Template for configuration
│   ├── .env                     # Environment variables
│   ├── server.js                # Express app & Socket.io server
│   ├── config/
│   │   ├── db.js                # Mongoose with automatic in-memory fallback
│   │   └── solana.js            # Solana Web3 connection pool & helpers
│   ├── models/
│   │   ├── Block.js             # Solana Block Mongoose schema
│   │   ├── Transaction.js       # Solana Transaction schema
│   │   ├── Token.js             # SPL Token schema
│   │   ├── Watchlist.js         # User bookmarks schema
│   │   └── NetworkStat.js       # Historical TPS & stats schema
│   ├── routes/
│   │   ├── stats.js             # Network overview & TPS chart
│   │   ├── blocks.js            # Blocks list & slot detail
│   │   ├── transactions.js      # Transactions list & detail
│   │   ├── accounts.js          # Wallet balance, tokens & history
│   │   ├── tokens.js            # SPL token ranking & details
│   │   ├── search.js            # Universal auto-detect search
│   │   └── watchlist.js         # Watchlist CRUD
│   ├── services/
│   │   ├── solanaService.js     # @solana/web3.js on-chain query engine
│   │   ├── priceService.js      # CoinGecko & Jupiter pricing
│   │   └── mockDataService.js   # Resilient fallback seeds & program dictionary
│   └── sockets/
│       └── streamer.js          # Socket.io live block/tx broadcaster
└── frontend/                    # React 19 + Vite + Tailwind CSS
    ├── package.json
    ├── vite.config.js           # Vite config with backend proxy
    ├── index.html               # Soltrace metadata, favicon, Inter font
    └── src/
        ├── main.jsx             # React entry point
        ├── App.jsx              # Routes & navigation
        ├── index.css            # Dark cyber theme & Solana gradients
        ├── api/
        │   └── client.js        # Axios instance with error handling
        ├── context/
        │   ├── NetworkContext.jsx   # Solana cluster switcher & Socket.io
        │   └── WatchlistContext.jsx # Saved items manager
        ├── components/
        │   ├── common/
        │   │   ├── CopyButton.jsx
        │   │   ├── StatusBadge.jsx
        │   │   ├── AddressLink.jsx
        │   │   ├── TxLink.jsx
        │   │   ├── QrModal.jsx
        │   │   └── LoadingSkeleton.jsx
        │   ├── layout/
        │   │   ├── Navbar.jsx
        │   │   ├── Footer.jsx
        │   │   └── SearchBar.jsx
        │   ├── dashboard/
        │   │   ├── StatsOverview.jsx
        │   │   ├── TpsChart.jsx
        │   │   ├── LatestBlocksTable.jsx
        │   │   └── LatestTransactionsTable.jsx
        │   └── transaction/
        │       ├── InstructionViewer.jsx
        │       └── BalanceChangesTable.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── BlocksPage.jsx
            ├── BlockDetailPage.jsx
            ├── TransactionsPage.jsx
            ├── TransactionDetailPage.jsx
            ├── AccountPage.jsx
            ├── TokensPage.jsx
            ├── TokenDetailPage.jsx
            ├── AnalyticsPage.jsx
            └── WatchlistPage.jsx
```

---

## How to Run Locally

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: (Optional — application automatically runs in zero-friction in-memory cache mode if a local MongoDB instance is not detected)

### 2. Start Both Backend and Frontend
From the root directory:

```bash
npm start
```

Or run each service individually:

**Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

---

## Verification & Screenshots
The browser subagent has validated end-to-end functionality across all routes (`/`, `/blocks`, `/txs`, `/tx/:signature`, `/tokens`, `/token/:mint`, `/account/:address`, `/analytics`, `/watchlist`).
