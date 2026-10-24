import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/search?q=...
router.get('/', async (req, res) => {
  try {
    const q = req.query.q;
    const network = req.query.network || 'mainnet-beta';

    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, error: 'Query parameter q is required' });
    }

    const result = await solanaService.universalSearch(q, network);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No matching transaction, account, token, or block found',
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
