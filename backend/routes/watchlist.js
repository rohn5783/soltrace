import express from 'express';

const router = express.Router();
const unavailable = (req, res) => res.status(501).json({ success: false, error: 'Server watchlists are disabled because this deployment has no user authentication. Use the browser-local watchlist.', code: 'AUTH_REQUIRED', requestId: req.id });
router.get('/', unavailable);
router.post('/', unavailable);
router.delete('/:address', unavailable);
export default router;
