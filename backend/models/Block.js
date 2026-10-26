import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema(
  {
    slot: {
      type: Number,
      required: true,
    },
    blockhash: {
      type: String,
      required: true,
    },
    previousBlockhash: {
      type: String,
    },
    parentSlot: {
      type: Number,
    },
    blockTime: {
      type: Date,
      index: true,
    },
    blockHeight: {
      type: Number,
    },
    txCount: {
      type: Number,
    },
    leader: {
      type: String,
    },
    reward: {
      type: Number,
    },
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

BlockSchema.index({ network: 1, slot: 1 }, { unique: true });

export default mongoose.models.Block || mongoose.model('Block', BlockSchema);
