// Backend API Server - Pure REST API without views

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Database Connection Helper
import dbConnect from '../lib/mongodb.js';

// Route Imports
import authRoutes from '../backend/routes/auth.js';
import productRoutes from '../backend/routes/product.js';
import cartRoutes from '../backend/routes/cart.js';
import orderRoutes from '../backend/routes/order.js';
import userRoutes from '../backend/routes/user.js';
import searchRoutes from '../backend/routes/search.js';
import sellerRoutes from '../backend/routes/seller.js';
import uploadRoutes from '../backend/routes/upload.js';

// Redis Configuration
import redisClient from '../backend/config/redis.js';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env and root .env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config(); // Also load from root if exists

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection middleware - ensures DB is connected before processing requests
app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await dbConnect();
        }
        next();
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        res.status(503).json({ 
            error: 'Database connection failed',
            message: 'Unable to connect to MongoDB. Please check your MONGODB_URI environment variable.',
            details: error.message 
        });
    }
});

// Security Middleware
app.use(helmet());

// CORS Configuration - Allow React frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api', apiLimiter);

// Body Parsing Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    
    // Log response status
    const oldSend = res.send;
    const oldJson = res.json;
    
    res.send = function(data) {
        console.log(`  → Response status: ${res.statusCode}`);
        oldSend.apply(res, arguments);
    };
    
    res.json = function(data) {
        console.log(`  → Response status: ${res.statusCode}`);
        oldJson.apply(res, arguments);
    };
    
    next();
});

// Serve uploaded files with CORS headers
const backendDir = path.join(__dirname, '../backend');
app.use('/uploads', (req, res, next) => {
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(backendDir, 'uploads')));

// Ensure uploads directory exists (skip in serverless)
const uploadsDir = path.join(backendDir, 'uploads');
if (process.env.VERCEL !== '1' && !fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Health Check Endpoint
app.get('/health', async (req, res) => {
    const mongoStatus = mongoose.connection.readyState;
    const mongoStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    // Try to connect if not connected
    if (mongoStatus !== 1) {
        try {
            await dbConnect();
        } catch (err) {
            console.error('Health check - MongoDB connection failed:', err);
        }
    }
    
    res.json({ 
        status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        mongodb: {
            status: mongoStates[mongoose.connection.readyState] || 'unknown',
            readyState: mongoose.connection.readyState,
            hasUri: !!process.env.MONGODB_URI,
            uriFormat: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'not set',
            host: mongoose.connection.host || 'not connected',
            error: mongoose.connection.readyState !== 1 ? 'Connection not established' : null
        },
        redis: {
            status: redisClient.isReady ? 'connected' : 'disconnected',
            ready: redisClient.isReady
        },
        environment: process.env.VERCEL ? 'vercel' : 'local',
        nodeVersion: process.version
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler for API
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl 
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start Server (skip in test environment)
// if (process.env.NODE_ENV !== 'test') {
//     app.listen(PORT, () => {
//         console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
//         console.log(`📊 Health check: http://localhost:${PORT}/health`);
//         console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
//     });
// }

export default app;
