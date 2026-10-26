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
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

// GET /api/stats/tps-chart
router.get('/tps-chart', (req, res) => {
  try {
    const points = solanaService.getHistoricalTps();
    res.json({ success: true, data: points });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: (process.env.NODE_ENV === 'production' && (error.statusCode || 500) >= 500) ? 'Request failed' : error.message, code: error.code || 'INTERNAL_ERROR', requestId: req.id });
  }
});

export default router;
