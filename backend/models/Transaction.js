import mongoose from 'mongoose';

const InstructionSchema = new mongoose.Schema({
  programId: { type: String, required: true },
  programName: { type: String, default: 'Unknown Program' },
  type: { type: String, default: 'custom' },
  parsed: { type: mongoose.Schema.Types.Mixed },
  rawData: { type: String },
  accounts: [{ type: String }],
});

const BalanceChangeSchema = new mongoose.Schema({
  account: { type: String, required: true },
  preBalance: { type: Number },
  postBalance: { type: Number },
  changeSol: { type: Number },
});

const TokenTransferSchema = new mongoose.Schema({
  from: { type: String },
  to: { type: String },
  amount: { type: Number },
  rawAmount: { type: String },
  tokenMint: { type: String },
  symbol: { type: String },
  decimals: { type: Number, default: 9 },
});

const TransactionSchema = new mongoose.Schema(
  {
    signature: {
      type: String,
      required: true,
    },
    slot: {
      type: Number,
      required: true,
      index: true,
    },
    blockTime: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['Success', 'Failed', 'Unavailable'],
    },
    err: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fee: {
      type: Number,
    },
    signer: {
      type: String,
    },
    recentBlockhash: {
      type: String,
    },
    instructions: [InstructionSchema],
    balanceChanges: [BalanceChangeSchema],
    tokenTransfers: [TokenTransferSchema],
    logs: [{ type: String }],
    network: {
      type: String,
      default: 'mainnet-beta',
      required: true,
    },
    source: { type: String, enum: ['rpc', 'cache'], required: true },
    fetchedAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ network: 1, signature: 1 }, { unique: true });
TransactionSchema.index({ network: 1, slot: -1 });
TransactionSchema.index({ network: 1, signer: 1, blockTime: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
