import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB')));
  
  // Use local MongoDB as fallback only in development
  if (process.env.VERCEL) {
    throw new Error('MONGODB_URI environment variable is required in Vercel. Please set it in your Vercel dashboard.');
  }
  
  console.warn('⚠️ Using local MongoDB as fallback');
}

const finalUri = MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
console.log('🔗 MongoDB URI configured:', finalUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    console.log('🔄 Connecting to MongoDB...');
    
    cached.promise = mongoose.connect(finalUri, opts)
      .then((mongoose) => {
        console.log('✅ Successfully connected to MongoDB');
        return mongoose;
      })
      .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        throw err;
      });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Failed to establish MongoDB connection:', e.message);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
