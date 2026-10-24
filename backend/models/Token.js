import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema(
  {
    mint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    decimals: {
      type: Number,
      default: 6,
    },
    supply: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    change24h: {
      type: Number,
      default: 0,
    },
    volume24h: {
      type: Number,
      default: 0,
    },
    marketCap: {
      type: Number,
      default: 0,
    },
    holdersCount: {
      type: Number,
      default: 0,
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

TokenSchema.index({ marketCap: -1 });
TokenSchema.index({ volume24h: -1 });

export default mongoose.models.Token || mongoose.model('Token', TokenSchema);
