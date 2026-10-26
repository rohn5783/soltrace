import { getConnection, validateNetwork, lamportsToSol } from '../config/solana.js';

export const initSocketStreamer = (io) => {
  if (process.env.SOLANA_STREAM_ENABLED !== 'true') {
    console.log('[stream] Live slot stream disabled; set SOLANA_STREAM_ENABLED=true to enable it with a WebSocket-capable RPC provider.');
    return async () => {};
  }

  const network = process.env.SOLANA_STREAM_NETWORK || process.env.SOLANA_NETWORK || 'mainnet-beta';
  validateNetwork(network);
  const connection = getConnection(network);
  const emittedSlots = new Set();
  const fetchedRoots = new Set();
  const lastErrorLog = new Map();
  let subscriptionId = null;
  let stopped = false;

  io.on('connection', (socket) => {
    socket.emit('connected', { message: 'Connected to Soltrace RPC slot stream', network, timestamp: new Date().toISOString() });
  });

  const onSlot = async (slotInfo) => {
    const slot = slotInfo?.slot;
    if (!Number.isSafeInteger(slot) || stopped || emittedSlots.has(slot)) return;
    emittedSlots.add(slot);
    if (emittedSlots.size > 512) emittedSlots.delete(emittedSlots.values().next().value);
    const timestamp = new Date().toISOString();
    io.emit('new_slot', { slot, parent: slotInfo.parent ?? null, root: slotInfo.root ?? null, network, timestamp });
    // Slot notifications can arrive before the slot is confirmed, and some RPC
    // providers do not retain every block. Fetch the finalized root instead.
    const root = slotInfo.root;
    if (!Number.isSafeInteger(root) || root <= 0 || stopped || fetchedRoots.has(root)) return;
    fetchedRoots.add(root);
    if (fetchedRoots.size > 512) fetchedRoots.delete(fetchedRoots.values().next().value);

    try {
      // web3.js v1 validates accountKeys as strings; jsonParsed returns objects
      // for those keys and fails response deserialization for getBlock.
      const block = await connection.getBlock(root, { commitment: 'finalized', encoding: 'json', maxSupportedTransactionVersion: 1, transactionDetails: 'full', rewards: true });
      if (!block) return;
      const transactions = block.transactions || [];
      io.emit('new_block', { slot: root, blockhash: block.blockhash, previousBlockhash: block.previousBlockhash, parentSlot: block.parentSlot, blockTime: block.blockTime == null ? null : new Date(block.blockTime * 1000), blockHeight: block.blockHeight ?? null, txCount: transactions.length, successfulTxCount: transactions.filter((tx) => tx.meta && !tx.meta.err).length, totalFees: transactions.every((tx) => Number.isFinite(tx.meta?.fee)) ? lamportsToSol(transactions.reduce((sum, tx) => sum + tx.meta.fee, 0)) : null, leader: null, reward: null, network, source: 'rpc', timestamp });
    } catch (error) {
      // -32004 means this RPC cannot provide that block (for example, it was
      // skipped or is outside the provider's retained ledger range). This is
      // expected for public/pruned RPCs, so avoid one warning per slot.
      const code = error.code || error.name || 'RPC error';
      if (code === -32004 || code === '-32004') return;
      const now = Date.now();
      if (now - (lastErrorLog.get(code) || 0) >= 60_000) {
        lastErrorLog.set(code, now);
        const message = String(error.message || 'No RPC error details provided')
          .replace(/(?:https?|wss?):\/\/[^\s"'`]+/gi, '[RPC endpoint]')
          .slice(0, 240);
        console.warn(`[stream] Could not fetch finalized block (RPC error: ${code}: ${message}); further identical warnings are rate-limited for 60s`);
      }
    }
  };

  subscriptionId = connection.onSlotChange(onSlot);
  return async () => {
    stopped = true;
    if (subscriptionId != null) await connection.removeSlotChangeListener(subscriptionId).catch(() => {});
  };
};
