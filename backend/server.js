import express from 'express';
import http from 'http';
import { randomUUID } from 'crypto';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, getDbStatus } from './config/db.js';
import { initSocketStreamer } from './sockets/streamer.js';
import { validateNetwork } from './config/solana.js';
import statsRoutes from './routes/stats.js';
import blocksRoutes from './routes/blocks.js';
import transactionsRoutes from './routes/transactions.js';
import accountsRoutes from './routes/accounts.js';
import tokensRoutes from './routes/tokens.js';
import searchRoutes from './routes/search.js';
import watchlistRoutes from './routes/watchlist.js';

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);
const server = http.createServer(app);
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'https://frontend-ecru-eight-24.vercel.app',
  ...(process.env.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
]);
const corsOptions = { origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), methods: ['GET', 'POST', 'DELETE'], credentials: false };
const io = new Server(server, { cors: corsOptions });
app.use(cors(corsOptions));
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  req.id = req.get('x-request-id')?.slice(0, 100) || randomUUID();
  res.setHeader('x-request-id', req.id);
  const start = Date.now();
  res.on('finish', () => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', requestId: req.id, method: req.method, route: req.path, network: req.query.network || null, status: res.statusCode, durationMs: Date.now() - start })));
  next();
});
const rateBuckets = new Map();
const rateBucketCleanup = setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, bucket] of rateBuckets) if (bucket.start < cutoff) rateBuckets.delete(key);
}, 60_000).unref();
app.use('/api', (req, res, next) => {
  const now = Date.now(); const key = `${req.ip}:${req.path.split('/')[2] || 'root'}`;
  const bucket = rateBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > 60_000) { bucket.start = now; bucket.count = 0; }
  bucket.count++; rateBuckets.set(key, bucket);
  const limit = req.path.includes('/transactions') || req.path.includes('/accounts') ? 60 : 180;
  if (bucket.count > limit) return res.status(429).json({ success: false, error: 'Rate limit exceeded', requestId: req.id });
  next();
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', platform: 'Soltrace Explorer API', timestamp: new Date().toISOString() }));
app.get('/api/ready', (_req, res) => {
  const database = getDbStatus(); const network = process.env.SOLANA_STREAM_NETWORK || process.env.SOLANA_NETWORK || 'mainnet-beta';
  let networkValid = true; try { validateNetwork(network); } catch { networkValid = false; }
  const ready = database.connected && networkValid;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'degraded', database, solanaNetworkConfigured: networkValid, timestamp: new Date().toISOString() });
});
app.get('/api/metrics', (_req, res) => res.json({ processUptimeSeconds: Math.round(process.uptime()), memoryBytes: process.memoryUsage().heapUsed, databaseConnected: getDbStatus().connected }));
app.use('/api/stats', statsRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use((req, res) => res.status(404).json({ success: false, error: 'Endpoint not found', requestId: req.id }));
app.use((err, req, res, _next) => {
  const status = err.statusCode || (err.type === 'entity.too.large' ? 413 : 500);
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', requestId: req.id, category: err.code || err.name || 'INTERNAL', message: err.message }));
  res.status(status).json({ success: false, error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Request failed' : err.message, code: err.code || 'INTERNAL_ERROR', requestId: req.id });
});

let stopStreamer = null;
const PORT = Number(process.env.PORT) || 5000;
const boot = async () => {
  await connectDB();
  try { stopStreamer = initSocketStreamer(io); } catch (error) { console.error(`[stream] Streamer unavailable: ${error.code || error.message}`); }
  server.listen(PORT, () => console.log(`[server] Soltrace API listening on port ${PORT}`));
};
const shutdown = async (signal) => {
  console.log(`[server] Shutting down after ${signal}`);
  clearInterval(rateBucketCleanup);
  await stopStreamer?.();
  io.close(async () => { await mongoose.disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
boot().catch((error) => { console.error(`[server] Startup failed: ${error.name}`); process.exitCode = 1; });
