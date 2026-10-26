# Architecture and data sources

Soltrace uses an existing Vite/React SPA and an Express API. The API connects to one HTTP and WebSocket endpoint per Solana cluster using `@solana/web3.js`. Network names are validated and each returned chain object retains its cluster name.

## Read paths

- Current slot, epoch and recent performance samples come from Solana RPC.
- Recent block discovery uses `getBlocks`; each produced slot is fetched with `getBlock`. A null result is not converted into a fabricated block.
- Transactions are looked up by validated base58 signature. Null means not found; transport failures are upstream errors.
- Wallet overview and token accounts come from RPC. Mint supply, decimals, and authorities come from parsed mint account data.
- SOL and SPL market prices are external market data with provider and timestamp metadata. They are optional and do not replace missing on-chain values.
- Historical chart values, validator decentralization statistics, token holder distribution, and market history are unavailable because no trusted historical/indexing source has been implemented for them.

## Realtime

A single server process subscribes to slot changes on `SOLANA_STREAM_NETWORK`. It emits actual slot notifications, then fetches a confirmed block before emitting a block summary. It does not stream all transactions. WebSocket events include their network and timestamp. The default public RPC may limit the slot subscription or block history; use a suitable provider in production.

## Indexer

Run `npm run indexer` as its own process. On first start it indexes a bounded recent window; later starts resume the checkpoint for that network. It discovers confirmed block slots, writes block summaries and normalized transaction details with network-scoped upserts, and advances its checkpoint after successful persistence. Slots omitted from a successful `getBlocks` range are treated as skipped. A block listed by discovery but unavailable from `getBlock` stops range advancement and is retried. This is not full historical indexing. Current HTTP list/detail endpoints still read live RPC directly; indexed records are not yet the API's cache/read-through source.

## Persistence and readiness

MongoDB connection failure is visible. The API can still serve direct RPC reads, while `/api/ready` returns 503 when MongoDB is disconnected or the configured stream network name is invalid. The indexer requires MongoDB. The models use unique network+slot, network+signature, and network+mint indexes. Existing deployments with conflicting data must resolve duplicates before those indexes can be built.

## Deferred components

Redis caching, distributed rate limiting, per-user watchlists/authentication, rich historical analytics, and a full account-history index are not implemented. The watchlist server API is disabled; bookmarks stay in browser local storage.

