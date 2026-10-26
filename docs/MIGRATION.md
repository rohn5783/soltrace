# Pre-deployment migration

Before applying the changed network-scoped unique indexes to an existing MongoDB deployment:

1. Take a database backup.
2. Configure `MONGODB_URI` for the target database.
3. Run `npm run migrate:indexes` from `backend`.

The script checks for duplicate `(network, slot)`, `(network, signature)`, and `(network, mint)` keys. It stops and prints a small conflict sample if duplicates exist. If clear, it synchronizes the Block, Transaction, and Token indexes; it never deletes records. `syncIndexes()` may remove obsolete indexes, so review your deployment's custom index needs before running.
