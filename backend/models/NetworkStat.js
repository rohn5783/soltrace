import mongoose from 'mongoose';

const NetworkStatSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      default: 'mainnet-beta',
      index: true,
    },
    currentSlot: {
      type: Number,
    },
    currentEpoch: {
      type: Number,
    },
    epochProgress: {
      type: Number,
    },
    slotIndex: {
      type: Number,
    },
    slotsInEpoch: {
      type: Number,
    },
    tps: {
      type: Number,
    },
    trueTps: {
      type: Number,
    },
    solPrice: {
      type: Number,
    },
    solPriceChange24h: {
      type: Number,
    },
    marketCap: {
      type: Number,
    },
    volume24h: {
      type: Number,
    },
    totalTransactions: {
      type: Number,
    },
    validatorCount: {
      type: Number,
    },
    circulatingSupply: {
      type: Number,
    },
    blockTime: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

NetworkStatSchema.index({ network: 1, createdAt: -1 });

export default mongoose.models.NetworkStat || mongoose.model('NetworkStat', NetworkStatSchema);
