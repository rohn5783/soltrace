import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';
import Token from '../models/Token.js';

const duplicates = async (model, fields) => model.aggregate([
  { $group: { _id: Object.fromEntries(fields.map((field) => [field, `$${field}`])), count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
  { $limit: 5 },
]);

try {
  if (!process.env.MONGODB_URI || !(await connectDB())) throw new Error('MONGODB_URI must point to a reachable database');
  const conflicts = [
    ['blocks', await duplicates(Block, ['network', 'slot'])],
    ['transactions', await duplicates(Transaction, ['network', 'signature'])],
    ['tokens', await duplicates(Token, ['network', 'mint'])],
  ].filter(([, rows]) => rows.length);
  if (conflicts.length) throw new Error(`Duplicate network-scoped records need manual review before index migration: ${JSON.stringify(conflicts)}`);
  for (const model of [Block, Transaction, Token]) await model.syncIndexes();
  console.log('[migration] Network-scoped indexes synchronized. No records were deleted.');
} catch (error) {
  console.error(`[migration] Failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
