import mongoose from 'mongoose';

const IndexCheckpointSchema = new mongoose.Schema({
  network: { type: String, required: true, enum: ['mainnet-beta', 'devnet', 'testnet'], unique: true },
  slot: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

export default mongoose.models.IndexCheckpoint || mongoose.model('IndexCheckpoint', IndexCheckpointSchema);
