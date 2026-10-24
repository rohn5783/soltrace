import { generateRecentBlocks, generateRecentTransactions } from '../services/mockDataService.js';

let intervalId = null;

export const initSocketStreamer = (io) => {
  let currentSlot = 312450820;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Send initial snapshot on connect
    socket.emit('connected', {
      message: 'Connected to Soltrace Live Stream',
      timestamp: Date.now(),
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Background broadcaster for live blocks and transactions
  if (!intervalId) {
    intervalId = setInterval(() => {
      currentSlot += 1;
      const [newBlock] = generateRecentBlocks(currentSlot, 1);
      const [newTx] = generateRecentTransactions(currentSlot, 1);

      const tpsPulse = Math.floor(2750 + Math.random() * 320);

      io.emit('new_block', newBlock);
      io.emit('new_transaction', newTx);
      io.emit('tps_pulse', {
        slot: currentSlot,
        tps: tpsPulse,
        timestamp: Date.now(),
      });
    }, 2800);
  }
};
