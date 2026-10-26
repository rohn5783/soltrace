# API reference

All routes use the `{ "success": true, "data": ... }` response envelope unless the endpoint returns a list count. Error responses include `success: false`, an error message, and where available a machine-readable code/request ID.

## Operational

- `GET /api/health` — process liveness and timestamp.
- `GET /api/ready` — MongoDB connectivity and configured cluster-name validity; returns 503 when degraded. It does not probe upstream RPC availability.
- `GET /api/metrics` — safe process uptime, memory use, and MongoDB connection status.

## Explorer

- `GET /api/stats/overview?network=mainnet-beta` — slot, epoch, performance sample TPS, optional SOL price fields. The total transaction count is RPC-backed; validator counts are null.
- `GET /api/stats/tps-chart` — currently an empty list until historical samples are stored.
- `GET /api/blocks?network=mainnet-beta&limit=15` — recent confirmed blocks. `limit` must be 1–50.
- `GET /api/blocks/:slot?network=mainnet-beta` — actual RPC block or 404 for a null block.
- `GET /api/transactions?network=mainnet-beta&limit=25&status=Success` — transactions from a bounded set of recent blocks. `limit` must be 1–50; status may be `Success`, `Failed`, or `Unavailable`.
- `GET /api/transactions/:signature?network=mainnet-beta` — actual transaction, 404 for null, 400 for malformed signature.
- `GET /api/accounts/:address?network=mainnet-beta` — SOL balance and account owner/executable metadata.
- `GET /api/accounts/:address/tokens?network=mainnet-beta` — parsed SPL and Token-2022 token accounts.
- `GET /api/accounts/:address/transactions?network=mainnet-beta&limit=20` — provider signature history; signer and transaction fee are not inferred.
- `GET /api/tokens?network=mainnet-beta` — on-chain metadata for a short curated set of known mints.
- `GET /api/tokens/:mint?network=mainnet-beta` — parsed mint supply, decimals, authorities, optional market price, and no fabricated holder count.
- `GET /api/search?q=...&network=...` — resolves slots, signatures, addresses, and a small curated token symbol list.

Server watchlist routes return 501 while no authentication and owner isolation are configured. Use browser-local bookmarks.

## Data metadata

Direct RPC responses include `source: "rpc"`, `network`, `fetchedAt`, and `stale: false`. Market prices include their independent source and fetch time. Missing values are `null`; the API does not synthesize a successful block or transaction after an RPC failure.


