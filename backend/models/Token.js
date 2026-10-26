import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema(
  {
    network: { type: String, default: 'mainnet-beta', required: true },
    mint: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    symbol: {
      type: String,
    },
    decimals: {
      type: Number,
    },
    supply: {
      type: Number,
    },
    price: {
      type: Number,
    },
    change24h: {
      type: Number,
    },
    volume24h: {
      type: Number,
    },
    marketCap: {
      type: Number,
    },
    holdersCount: {
      type: Number,
    },
    icon: {
      type: String,
      default: '',
    },
    freezeAuthority: {
      type: String,
      default: null,
    },
    mintAuthority: {
      type: String,
      default: null,
    },
    coingeckoId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

TokenSchema.index({ network: 1, mint: 1 }, { unique: true });
TokenSchema.index({ network: 1, marketCap: -1 });
TokenSchema.index({ network: 1, volume24h: -1 });

export default mongoose.models.Token || mongoose.model('Token', TokenSchema);
