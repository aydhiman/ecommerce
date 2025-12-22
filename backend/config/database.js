// MongoDB Atlas Connection Configuration
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

// Log connection string (masked for security)
const maskedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log('🔗 MongoDB URI configured:', maskedUri);

// Connection options optimized for MongoDB Atlas
const connectionOptions = {
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 5,
  
  // Timeout settings
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // Keep alive settings for Atlas
  heartbeatFrequencyMS: 10000,
  
  // Write concern
  w: 'majority',
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
};

// Cached connection for serverless/edge environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB Atlas
 * Uses connection caching for serverless environments
 */
export async function connectDB() {
  // Return cached connection if available
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  // Create new connection if no cached promise exists
  if (!cached.promise) {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions)
      .then((mongoose) => {
        console.log('✅ Successfully connected to MongoDB Atlas');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB Atlas connection error:', error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

/**
 * Check if MongoDB is connected
 */
export function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection status string
 */
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📦 MongoDB Atlas connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Atlas connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Atlas disconnected');
});

export default { connectDB, disconnectDB, isConnected, getConnectionStatus };
