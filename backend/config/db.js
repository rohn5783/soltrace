import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[database] MONGODB_URI is not configured; persistence is unavailable');
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS) || 8000, connectTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS) || 8000 });
    console.log('[database] MongoDB connected');
    return true;
  } catch (error) {
    console.error(`[database] MongoDB connection failed: ${error.name || 'ConnectionError'}`);
    return false;
  }
};

export const getDbStatus = () => ({ connected: mongoose.connection.readyState === 1, readyState: mongoose.connection.readyState });
