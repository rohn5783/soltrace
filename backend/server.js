import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDbStatus } from './config/db.js';
import { initSocketStreamer } from './sockets/streamer.js';

// Route imports
import statsRoutes from './routes/stats.js';
import blocksRoutes from './routes/blocks.js';
import transactionsRoutes from './routes/transactions.js';
import accountsRoutes from './routes/accounts.js';
import tokensRoutes from './routes/tokens.js';
import searchRoutes from './routes/search.js';
import watchlistRoutes from './routes/watchlist.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database (with resilient fallback)
connectDB();

// Initialize Live Streamer
initSocketStreamer(io);

// Health & Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Soltrace Explorer API',
    database: getDbStatus(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/stats', statsRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/watchlist', watchlistRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Soltrace Explorer Backend Running on Port ${PORT}`);
  console.log(` REST Endpoints: http://localhost:${PORT}/api/stats/overview`);
  console.log(` WebSocket Stream: ws://localhost:${PORT}`);
  console.log(`===============================================`);
});
