import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/tokens - Top SPL tokens
router.get('/', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const tokens = await solanaService.getTokens(network);
    res.json({ success: true, count: tokens.length, data: tokens });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

// GET /api/tokens/:mint - Token details by mint address
router.get('/:mint', async (req, res) => {
  try {
    const mint = req.params.mint;
    const network = req.query.network || 'mainnet-beta';
    const token = await solanaService.getTokenByMint(mint, network);
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found', code: 'NOT_FOUND', requestId: req.id });
    }
    res.json({ success: true, data: token });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

export default router;
