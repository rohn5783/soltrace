# Technical audit

Audit date: 2026-10-24. The initial working tree was clean. The repository is a React/Vite frontend and Express/Mongoose backend, with Solana web3.js RPC access and Socket.IO. There was no Redis client, indexer worker, backend test suite, CI workflow, Docker configuration, or committed environment example in the tracked file inventory.

## Confirmed defects

- `backend/services/solanaService.js` seeded memory arrays with random blocks and transactions, then rebuilt those arrays using only a real current slot. That made synthetic signatures, hashes, status, rewards, balance changes, historical TPS, and fake account/token data appear live.
- Unknown transaction lookups returned a fabricated successful transfer after RPC failure or a null RPC result. RPC outages and unknown signatures were conflated.
- Network selection silently mapped unsupported values to mainnet. Signature validation checked only string length and alphabet.
- Transaction parsing referenced undefined `programName`, defaulted missing transaction metadata to success/fees, and did not match both token balance sides exactly. Token balances with missing pre or post entries were omitted.
- Overview metrics used hardcoded TPS, epochs, validator counts, total transactions, SOL market values, and fallback data. Price service carried a hardcoded price cache and returned fabricated values on failure.
- Account RPC errors fell back to a fake funded wallet, token account failures returned fake USDC/JUP balances, token mint lookup returned fabricated supply/authorities/market data, and account activity was reassigned from unrelated random transactions.
- Socket.IO broadcast generated blocks, transactions, and TPS on a timer, independent of chain state.
- MongoDB connection failures were hidden behind an in-memory fallback; the server logged the full connection URI. Health reported liveness as if persistence were available.
- Watchlists were global and seeded with demo wallets. Any caller could read or mutate the same items without authentication. Frontend components also had hardcoded fallback metrics and zero-like values for missing price/fees/rewards/holders.
- Model defaults implied successful transactions, current timestamps, fees, and network metrics when data was unknown. Transaction uniqueness did not include network.

## Implemented in this change

- Solana RPC configuration now rejects unsupported clusters, supports only the three declared clusters, uses a single configured endpoint per cluster, validates commitment, bounds timeouts and retries, and avoids logging the endpoint.
- Direct RPC data paths replace synthetic block/transaction/account/token activity. Recent blocks are discovered with `getBlocks`; transaction lookups validate base58 decoded signature length and return not found on an RPC null. RPC errors propagate as upstream failures.
- Transaction normalization handles parsed and partially decoded instructions, inner instructions, versioned account-key representations, failed execution, null metadata, exact raw SPL token amount deltas, and absent token-balance sides. Token account changes are labeled as changes, not inferred transfers.
- Network overview uses RPC slot/epoch/performance samples. External market prices are optional, separately sourced, timestamped, cached, and absent on provider failure. Historical TPS chart is empty until an actual history store exists.
- Socket.IO emits RPC slot updates and only emits block summaries after fetching the corresponding confirmed block. No synthetic transaction or TPS pulses are emitted. One global subscription is created at server startup.
- MongoDB failure is visible; no fake persistence path remains. `/api/health`, `/api/ready`, and `/api/metrics` distinguish liveness from dependency readiness. Server shutdown closes the slot listener, sockets, HTTP server, and MongoDB.
- API inputs for network, slot, key, signature, and limits are validated at the service boundary. JSON size, CORS origins, request IDs, basic per-IP rate limits, and structured request/error logs are configured.
- Server-wide watchlists are disabled until an authentication/ownership model exists. Browser-local watchlists remain available through the existing frontend fallback.
- Network-scoped unique indexes and unknown-value-friendly model fields were added. A standalone bounded recent indexer persists actual blocks/transactions and per-network checkpoints.
- Nine deterministic tests cover network/key validation, timeout behavior, parsed success/failure, absent metadata, token balance creation/closure, instruction decoding, and versioned account keys.
- Frontend hardcoded network metrics and invented fallback prices, fees, rewards, validator totals, token holder counts, and TPS ratios were replaced with explicit unavailable values.

## Potential risks requiring deployment testing

- Public Solana RPC endpoints are rate-limited and may not retain full historical blocks or support every requested transaction version. Production should configure a provider with appropriate history and limits.
- Timeout uses a bounded Promise race around web3.js. A timed-out underlying HTTP request may continue until the SDK transport finishes; request abort is not wired through the public Connection API.
- `getBlock` results can be pruned or unavailable. The request path reports the RPC result; the indexer stops advancing when a discovered block cannot be fetched, then retries.
- JSON parsed instruction representation differs by provider and transaction version. Tests cover normalized shapes, not every provider's live payload.
- Socket slot subscription and confirmed block retrieval were not verified against an external RPC/WebSocket provider in this environment.
- MongoDB index migration checks for duplicate network-scoped keys and stops for manual review; run it only after taking a backup.
- Browser-local watchlists do not synchronize across devices and are not user-authenticated.

## Feature status

| Area | Status |
|---|---|
| RPC network selection, block/detail/account/transaction reads | Implemented; deterministic tests cover normalization, no live-provider verification |
| Token on-chain mint metadata and market data separation | Implemented; provider data and UI not end-to-end verified |
| Socket slot/block updates | Implemented; live WebSocket not verified |
| MongoDB failure reporting and network-scoped models | Implemented; live DB not verified |
| Recent block/transaction indexer with checkpoint | Implemented; MongoDB/RPC runtime not verified |
| Redis cache | Not implemented |
| Authenticated server watchlists | Not implemented; server endpoints intentionally disabled |
| API validation, request limits, logs, health/readiness | Partially implemented; rate limiting is in-process and not distributed |
| Docker/Compose and CI | Added; build status reported separately |
| Full history, transaction address history beyond provider RPC, token holder distribution, historical TPS chart | Not implemented; unavailable values shown honestly |

## Validation strategy

- Run `npm test` from `backend` for deterministic service/normalizer tests.
- Run `npm run build` and `npm run lint` from `frontend`.
- Check module syntax and imports for backend API and worker.
- Build Docker images where Docker is available. Compose runtime requires MongoDB; the API and worker should be tested against a dedicated RPC endpoint with history.
- Before deployment, verify CORS origins, RPC provider history/version support, MongoDB connectivity/index migration, Socket.IO transport, and a worker restart/checkpoint cycle.



## Dependency audit note

`npm audit --omit=dev` initially found 9 advisories, including 3 high tied to an unused `@solana/spl-token` dependency and its `bigint-buffer` chain. That unused package was removed; the backend creates the two token program `PublicKey` constants directly. A second production audit reports 4 moderate advisories through `jayson`/`stream-json`/`uuid` under `@solana/web3.js` 1.99.0. npm proposes a breaking web3.js 3.x upgrade. This pass does not apply that major migration; plan a separate SDK compatibility upgrade and re-run the full suite before production.
