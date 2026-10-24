import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      index: true,
    },
    label: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['account', 'token', 'transaction'],
      default: 'account',
    },
    network: {
      type: String,
      default: 'mainnet-beta',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

WatchlistSchema.index({ address: 1, network: 1 }, { unique: true });

export default mongoose.models.Watchlist || mongoose.model('Watchlist', WatchlistSchema);
