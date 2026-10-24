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
      default: 0,
    },
    currentEpoch: {
      type: Number,
      default: 0,
    },
    epochProgress: {
      type: Number,
      default: 0, // 0 to 100 percentage
    },
    slotIndex: {
      type: Number,
      default: 0,
    },
    slotsInEpoch: {
      type: Number,
      default: 432000,
    },
    tps: {
      type: Number,
      default: 2800,
    },
    trueTps: {
      type: Number,
      default: 750, // Non-vote TPS
    },
    solPrice: {
      type: Number,
      default: 185.5,
    },
    solPriceChange24h: {
      type: Number,
      default: 3.42,
    },
    marketCap: {
      type: Number,
      default: 88500000000,
    },
    volume24h: {
      type: Number,
      default: 4200000000,
    },
    totalTransactions: {
      type: Number,
      default: 320000000000,
    },
    validatorCount: {
      type: Number,
      default: 1420,
    },
    circulatingSupply: {
      type: Number,
      default: 470000000,
    },
    blockTime: {
      type: Number,
      default: 400, // ms
    },
  },
  {
    timestamps: true,
  }
);

NetworkStatSchema.index({ createdAt: -1 });

export default mongoose.models.NetworkStat || mongoose.model('NetworkStat', NetworkStatSchema);
