import express from 'express';
import Watchlist from '../models/Watchlist.js';
import mongoose from 'mongoose';

const router = express.Router();

// In-memory fallback if MongoDB is disconnected
let memoryWatchlist = [
  {
    address: '8W3g9t3H6uW3Qe2Z8u3K2v9N1m5L7x4J3k2V9n8M7x6',
    label: 'Whale Staking Wallet',
    type: 'account',
    network: 'mainnet-beta',
    notes: 'Tracking top SOL delegator',
    createdAt: new Date(),
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    label: 'USD Coin Mint',
    type: 'token',
    network: 'mainnet-beta',
    notes: 'Main USDC contract',
    createdAt: new Date(),
  },
];

// GET /api/watchlist
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const items = await Watchlist.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: items.length, data: items });
    }
    return res.json({ success: true, count: memoryWatchlist.length, data: memoryWatchlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/watchlist
router.post('/', async (req, res) => {
  try {
    const { address, label, type, network, notes } = req.body;
    if (!address) {
      return res.status(400).json({ success: false, error: 'Address is required' });
    }

    const newItem = {
      address: address.trim(),
      label: label || 'My Bookmark',
      type: type || 'account',
      network: network || 'mainnet-beta',
      notes: notes || '',
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const saved = await Watchlist.findOneAndUpdate(
        { address: newItem.address, network: newItem.network },
        newItem,
        { upsert: true, new: true }
      );
      return res.json({ success: true, data: saved });
    }

    const existingIdx = memoryWatchlist.findIndex((i) => i.address === newItem.address);
    if (existingIdx >= 0) {
      memoryWatchlist[existingIdx] = newItem;
    } else {
      memoryWatchlist.unshift(newItem);
    }

    res.json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/watchlist/:address
router.delete('/:address', async (req, res) => {
  try {
    const address = req.params.address;
    if (mongoose.connection.readyState === 1) {
      await Watchlist.deleteMany({ address });
    }
    memoryWatchlist = memoryWatchlist.filter((i) => i.address !== address);
    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
