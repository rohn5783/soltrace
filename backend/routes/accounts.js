import express from 'express';
import { solanaService } from '../services/solanaService.js';

const router = express.Router();

// GET /api/accounts/:address - Account overview (SOL balance, USD value, owner)
router.get('/:address', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const address = req.params.address;
    const account = await solanaService.getAccountOverview(network, address);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/accounts/:address/tokens - SPL Token accounts
router.get('/:address/tokens', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const address = req.params.address;
    const tokens = await solanaService.getAccountTokens(network, address);
    res.json({ success: true, count: tokens.length, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/accounts/:address/transactions - Account transaction history
router.get('/:address/transactions', async (req, res) => {
  try {
    const network = req.query.network || 'mainnet-beta';
    const address = req.params.address;
    const limit = parseInt(req.query.limit || '20', 10);
    const txs = await solanaService.getAccountTransactions(network, address, limit);
    res.json({ success: true, count: txs.length, data: txs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
