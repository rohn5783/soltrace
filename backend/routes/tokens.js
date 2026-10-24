import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/tokens - Top SPL tokens
router.get('/', async (req, res) => {
  try {
    const tokens = await solanaService.getTokens();
    res.json({ success: true, count: tokens.length, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tokens/:mint - Token details by mint address
router.get('/:mint', async (req, res) => {
  try {
    const mint = req.params.mint;
    const token = await solanaService.getTokenByMint(mint);
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }
    res.json({ success: true, data: token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
