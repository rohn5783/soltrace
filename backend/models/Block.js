import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema(
  {
    slot: {
      type: Number,
      required: true,
      index: true,
    },
    blockhash: {
      type: String,
      required: true,
      index: true,
    },
    previousBlockhash: {
      type: String,
    },
    parentSlot: {
      type: Number,
    },
    blockTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    blockHeight: {
      type: Number,
    },
    txCount: {
      type: Number,
      default: 0,
    },
    leader: {
      type: String,
      default: 'Unknown',
      index: true,
    },
    reward: {
      type: Number,
      default: 0,
    },
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

BlockSchema.index({ slot: -1, network: 1 });

export default mongoose.models.Block || mongoose.model('Block', BlockSchema);
