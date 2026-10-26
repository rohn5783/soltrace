import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/blocks - Latest blocks
router.get('/', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const limit = req.query.limit === undefined ? 15 : Number(req.query.limit);
    const blocks = await solanaService.getLatestBlocks(network, limit);
    res.json({ success: true, count: blocks.length, data: blocks });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

// GET /api/blocks/:slot - Block details
router.get('/:slot', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const slot = req.params.slot;
    const block = await solanaService.getBlockBySlot(network, slot);
    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found', code: 'NOT_FOUND', requestId: req.id });
    }
    res.json({ success: true, data: block });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

export default router;
