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
  preBalance: { type: Number, default: 0 },
  postBalance: { type: Number, default: 0 },
  changeSol: { type: Number, default: 0 },
});

const TokenTransferSchema = new mongoose.Schema({
  from: { type: String },
  to: { type: String },
  amount: { type: Number },
  tokenMint: { type: String },
  symbol: { type: String },
  decimals: { type: Number, default: 9 },
});

const TransactionSchema = new mongoose.Schema(
  {
    signature: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slot: {
      type: Number,
      required: true,
      index: true,
    },
    blockTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['Success', 'Failed'],
      default: 'Success',
      index: true,
    },
    err: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fee: {
      type: Number,
      default: 0.000005,
    },
    signer: {
      type: String,
      required: true,
      index: true,
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ slot: -1, network: 1 });
TransactionSchema.index({ signer: 1, blockTime: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
