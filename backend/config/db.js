import mongoose from 'mongoose';

let isConnected = false;
let isInMemoryFallback = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/soltrace';
  
  try {
    // Attempt connection with reasonable timeout for cloud Atlas clusters
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to ${uri}`);
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed (${error.message}).`);
    console.warn(`[Database] Running in resilient In-Memory Cache mode (Full explorer functionality active).`);
    isConnected = false;
    isInMemoryFallback = true;
  }
};

export const getDbStatus = () => ({
  connected: isConnected,
  isInMemoryFallback,
  readyState: mongoose.connection.readyState,
});
