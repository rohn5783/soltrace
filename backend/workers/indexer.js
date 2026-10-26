import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { getConnection, validateNetwork } from '../config/solana.js';
import { rpc, normalizeTransaction } from '../services/solanaService.js';
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';
import IndexCheckpoint from '../models/IndexCheckpoint.js';

const network = process.env.SOLANA_INDEX_NETWORK || 'mainnet-beta';
const batchSize = Math.min(Math.max(Number(process.env.INDEXER_BATCH_SIZE) || 20, 1), 100);
const initialLookback = Math.min(Math.max(Number(process.env.INDEXER_INITIAL_LOOKBACK_SLOTS) || 100, 1), 10000);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let stopping = false;

const persistBlock = async (connection, slot) => {
  const rawBlock = await rpc(() => connection.getBlock(slot, { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 1, transactionDetails: 'full', rewards: true }));
  if (!rawBlock) throw new Error(`Confirmed block ${slot} was listed by getBlocks but getBlock returned null`);
  const block = {
    network, slot, blockhash: rawBlock.blockhash, previousBlockhash: rawBlock.previousBlockhash, source: 'rpc', fetchedAt: new Date(),
    parentSlot: rawBlock.parentSlot, blockTime: rawBlock.blockTime == null ? undefined : new Date(rawBlock.blockTime * 1000),
    blockHeight: rawBlock.blockHeight ?? undefined, txCount: rawBlock.transactions?.length ?? 0,
  };
  await Block.updateOne({ network, slot }, { $set: block }, { upsert: true });
  const docs = (rawBlock.transactions || []).map((raw) => {
    const signature = raw.transaction?.signatures?.[0];
    if (!signature) return null;
    const normalized = normalizeTransaction({ ...raw, slot, blockTime: rawBlock.blockTime }, signature, network);
    const { signature: txSignature, slot: txSlot, blockTime, status, err, fee, signer, recentBlockhash, instructions, balanceChanges, tokenTransfers } = normalized;
    return { network, signature: txSignature, slot: txSlot, blockTime: blockTime || undefined, status, err, fee: fee ?? undefined, signer: signer || undefined, recentBlockhash, instructions, balanceChanges, tokenTransfers, source: 'rpc', fetchedAt: new Date() };
  }).filter(Boolean);
  if (docs.length) await Transaction.bulkWrite(docs.map((doc) => ({ updateOne: { filter: { network, signature: doc.signature }, update: { $set: doc }, upsert: true } })), { ordered: false });
  return docs.length;
};

const updateCheckpoint = async (slot) => IndexCheckpoint.updateOne({ network }, { $set: { network, slot, updatedAt: new Date() } }, { upsert: true });

const run = async () => {
  validateNetwork(network);
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for indexer persistence');
  await connectDB();
  if (mongoose.connection.readyState !== 1) throw new Error('MongoDB is unavailable; indexer cannot persist checkpoints');
  const connection = getConnection(network);
  const checkpoint = await IndexCheckpoint.findOne({ network }).lean();
  const current = await rpc(() => connection.getSlot('confirmed'));
  let cursor = checkpoint?.slot ?? Math.max(0, current - initialLookback);
  let failures = 0;
  console.log(`[indexer] Starting bounded recent indexer network=${network} checkpoint=${cursor} batchSize=${batchSize}`);
  while (!stopping) {
    try {
      const head = await rpc(() => connection.getSlot('confirmed'));
      if (cursor >= head) { await sleep(1000); continue; }
      const end = Math.min(head, cursor + batchSize);
      const slots = await rpc(() => connection.getBlocks(cursor + 1, end, 'confirmed'));
      let txCount = 0;
      for (const slot of slots) {
        if (stopping) break;
        txCount += await persistBlock(connection, slot);
        await updateCheckpoint(slot);
        cursor = slot;
      }
      // A successful getBlocks response covers skipped slots too. Move through the verified range.
      if (!stopping && cursor < end) { await updateCheckpoint(end); cursor = end; }
      failures = 0;
      console.log(`[indexer] checkpoint=${cursor} blocks=${slots.length} transactions=${txCount}`);
    } catch (error) {
      failures++;
      const delay = Math.min(30000, 500 * (2 ** Math.min(failures, 6))) + Math.floor(Math.random() * 500);
      console.error(`[indexer] network=${network} checkpoint=${cursor} category=${error.code || error.name} retryMs=${delay}`);
      await sleep(delay);
    }
  }
};

const shutdown = () => { stopping = true; };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
try { await run(); } finally { await mongoose.disconnect(); }
