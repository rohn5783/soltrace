# Soltrace

Soltrace is a Solana explorer UI with direct RPC reads and an optional recent-block indexer. Direct RPC lookup and indexed history are distinct: the API currently queries the configured Solana cluster for live state, while the indexer stores a bounded recent range from its configured starting slot. It does not index the whole chain.

## Architecture and status

```text
React/Vite ── REST + Socket.IO ── Express API ── Solana JSON RPC / WebSocket
                                      │
                                      └── MongoDB (optional reads, required for indexer)

Indexer worker ── Solana RPC ── MongoDB blocks, transactions, checkpoints
```

- **Implemented:** direct RPC slot/epoch/performance samples; block details and recent confirmed blocks; signature lookup; account balance and SPL token accounts; mint supply/decimals/authorities; external price lookup with timestamps; live slot/block Socket.IO events; shared network-stat snapshots pushed to all clients every 30 seconds by default; bounded restartable indexer; health/readiness and unit tests.
- **Partial:** MongoDB models/indexes; the HTTP explorer primarily serves direct RPC responses and does not yet use indexed records as its read-through store. Metrics are process-level only. Rate limiting is local to one API process.
- **Unavailable/planned:** Redis caching, full chain indexing, historical TPS chart, complete address history independent of provider support, holder distribution, validator decentralization metrics, authenticated cloud watchlists.

## Requirements and installation

- Node.js 20 or newer (the frontend currently uses Vite 8).
- npm.
- MongoDB is required for the indexer and optional persistence. The API can still serve direct RPC reads when MongoDB is unavailable; `/api/ready` reports degraded readiness when MongoDB is unavailable or the configured cluster name is invalid.
- Docker Compose is optional for local MongoDB and app services.

```bash
npm --prefix backend ci
npm --prefix frontend ci
Copy-Item backend/.env.example backend/.env
```

Configure `backend/.env` with a suitable RPC endpoint and MongoDB URI. Do not commit `.env` files or API keys. The public cluster endpoints are convenience defaults and are rate-limited; production should use a Solana provider that supports historical transactions and blocks.

## Environment

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API listen port | `5000` |
| `NODE_ENV` | Error detail mode | unset/development |
| `MONGODB_URI` | MongoDB connection string | unset; persistence unavailable |
| `MONGODB_TIMEOUT_MS` | MongoDB connection timeout | `8000` |
| `SOLANA_RPC_MAINNET` | Mainnet HTTP RPC URL | Solana public endpoint |
| `SOLANA_RPC_DEVNET` | Devnet HTTP RPC URL | Solana public endpoint |
| `SOLANA_RPC_TESTNET` | Testnet HTTP RPC URL | Solana public endpoint |
| `SOLANA_WS_MAINNET` / `SOLANA_WS_DEVNET` / `SOLANA_WS_TESTNET` | Optional provider WebSocket URLs | Derived from HTTP RPC URL |
| `SOLANA_STREAM_ENABLED` | Enable the live slot subscription | `false` |
| `SOLANA_COMMITMENT` | `processed`, `confirmed`, or `finalized` | `confirmed` |
| `SOLANA_RPC_TIMEOUT_MS` | Bounded RPC timeout (1–60 seconds) | `10000` |
| `SOLANA_RPC_MAX_RETRIES` | Retry count (0–5) | `2` |
| `SOLANA_STREAM_NETWORK` | Network used by the single global slot stream | `mainnet-beta` |
| `SOLANA_STATS_BROADCAST_INTERVAL_MS` | Shared Socket.IO network-stat refresh interval (15–120 seconds) | `30000` |
| `CORS_ORIGINS` | Additional comma-separated frontend origins; localhost and the production Vercel origin are included by default | localhost Vite/3000, Soltrace Vercel site |
| `MARKET_DATA_TIMEOUT_MS` | External market data timeout | `4000` |
| `SOLANA_INDEX_NETWORK` | Indexer cluster | `mainnet-beta` |
| `INDEXER_BATCH_SIZE` | Maximum slot range per indexer batch (1–100) | `20` |
| `INDEXER_INITIAL_LOOKBACK_SLOTS` | First-run recent slot lookback (1–10000) | `100` |
| `VITE_BACKEND_URL` | Frontend backend origin | same-origin `/api` in dev proxy mode |

A provider URL may contain credentials; keep it in an environment secret and do not print it in logs.

## Run locally

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

Review [the index migration notes](docs/MIGRATION.md) before applying schema indexes to an existing database.

Run the bounded indexer separately after setting MongoDB:

```bash
npm --prefix backend run indexer
```

The first run starts `INDEXER_INITIAL_LOOKBACK_SLOTS` behind the current confirmed slot. Later runs resume from the per-network checkpoint. The indexer records produced blocks and transactions; successful `getBlocks` ranges also advance over skipped slots. It is not a historical backfill by default.

## API examples

```text
GET /api/health
GET /api/ready
GET /api/metrics
GET /api/stats/overview?network=mainnet-beta
GET /api/blocks?network=mainnet-beta&limit=15
GET /api/blocks/300000000?network=mainnet-beta
GET /api/transactions/<base58-signature>?network=mainnet-beta
GET /api/accounts/<public-key>?network=mainnet-beta
GET /api/accounts/<public-key>/tokens?network=mainnet-beta
GET /api/tokens/<mint>?network=mainnet-beta
```

Invalid network/key/signature/slot/limit inputs return HTTP 400. Unknown blocks and transactions return 404; RPC failures return an upstream error. Responses use the existing `{ success, data }` envelope. Direct RPC objects include `source: "rpc"`, `network`, `fetchedAt`, and `stale: false`. Market data has its own provider/time fields. Missing values are null or unavailable, not estimates.

`/api/watchlist` server routes are disabled until authentication and per-user ownership are implemented. The frontend retains browser-local bookmarks.

## Tests and builds

```bash
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

## Deployment

- **Vercel/Netlify:** deploy `frontend` as a Vite SPA. Set `VITE_BACKEND_URL` to the deployed API origin and preserve the existing SPA rewrite files. This is required: the static frontend host does not run the Express API. Vite embeds this value at build time, so redeploy after changing it.
- **Render:** deploy `backend` as a Node service. Set `MONGODB_URI`, a production RPC provider URL for each enabled network, commitment, timeout/retry values, and `CORS_ORIGINS` to include the exact frontend origin. The public Solana RPC is rate-limited and is not suitable for sustained explorer traffic. If enabling live slots, set `SOLANA_STREAM_ENABLED=true` and configure the matching provider WebSocket URL. Keep the worker as a separate process using `npm run indexer`; do not start it inside the API.
- **Socket.IO:** allow the frontend origin in `CORS_ORIGINS`. The current backend has one configured global stream network; switching a client UI cluster does not dynamically create per-network socket subscriptions.
- **Docker Compose:** `docker compose up --build` runs frontend, API, and local MongoDB. Use `--profile worker` to add the indexer. Compose Redis is not included because the application does not yet have a Redis client/cache implementation.

## Known limitations and security

The public RPC endpoint may rate limit, prune blocks, or omit historical transaction data. Solscan does not claim a full-chain index. External token pricing is best-effort and does not provide 24-hour change, volume, rankings, or reliable market cap in all cases. Holder counts are not inferred from partial account lists. Watchlists are local-only. Set strong database credentials and restrict database/network access. Never expose provider keys in frontend variables or logs.

The current backend production dependency audit has 4 moderate advisories in the `@solana/web3.js` 1.x → `jayson` dependency tree. Removing an unused SPL Token dependency eliminated 3 high findings. Address the remaining advisories in a planned web3.js 3.x compatibility migration; do not apply npm's forced major upgrade without API migration and tests.
