import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/transactions - Latest transactions
router.get('/', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const limit = req.query.limit === undefined ? 25 : Number(req.query.limit);
    const status = req.query.status; // 'Success' or 'Failed'
    if (status && !['success', 'failed', 'unavailable'].includes(String(status).toLowerCase())) {
      return res.status(400).json({ success: false, error: 'status must be Success, Failed, or Unavailable', code: 'INVALID_INPUT', requestId: req.id });
    }

    let txs = await solanaService.getLatestTransactions(network, limit);
    if (status) {
      txs = txs.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    res.json({ success: true, count: txs.length, data: txs });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

// GET /api/transactions/:signature - Transaction details
router.get('/:signature', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const signature = req.params.signature;
    const tx = await solanaService.getTransaction(network, signature);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found', code: 'NOT_FOUND', requestId: req.id });
    }
    res.json({ success: true, data: tx });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

export default router;
