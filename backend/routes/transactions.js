import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/transactions - Latest transactions
router.get('/', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const limit = parseInt(req.query.limit || '25', 10);
    const status = req.query.status; // 'Success' or 'Failed'

    let txs = await solanaService.getLatestTransactions(network, limit);
    if (status) {
      txs = txs.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    res.json({ success: true, count: txs.length, data: txs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/transactions/:signature - Transaction details
router.get('/:signature', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const signature = req.params.signature;
    const tx = await solanaService.getTransaction(network, signature);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, data: tx });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
