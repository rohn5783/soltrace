import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/blocks - Latest blocks
router.get('/', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const limit = parseInt(req.query.limit || '15', 10);
    const blocks = await solanaService.getLatestBlocks(network, limit);
    res.json({ success: true, count: blocks.length, data: blocks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/blocks/:slot - Block details
router.get('/:slot', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const slot = req.params.slot;
    const block = await solanaService.getBlockBySlot(network, slot);
    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }
    res.json({ success: true, data: block });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
