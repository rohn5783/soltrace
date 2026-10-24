import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/stats/overview
router.get('/overview', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const stats = await solanaService.getNetworkOverview(network);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stats/tps-chart
router.get('/tps-chart', (req, res) => {
  try {
    const points = solanaService.getHistoricalTps();
    res.json({ success: true, data: points });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
