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
import { createServer } from 'http';

// Route Imports
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import userRoutes from './routes/user.js';
import searchRoutes from './routes/search.js';
import sellerRoutes from './routes/seller.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import communityRoutes from './routes/community.js';

// Database & Redis Configuration
import { connectDB, isConnected, getConnectionStatus } from './config/database.js';
import redisClient from './config/redis.js';

// WebSocket Configuration
import { initializeWebSocket } from './websocket/handler.js';

// Configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use('/uploads', (req, res, next) => {
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists (for local storage fallback)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Database Connection - MongoDB Atlas
connectDB()
    .then(() => console.log('✅ Database connection initialized'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        mongodb: isConnected() ? 'connected' : getConnectionStatus(),
        redis: redisClient.isReady ? 'connected' : 'disconnected'
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
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);

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

// Create HTTP server for both Express and WebSocket
const httpServer = createServer(app);

// Initialize WebSocket server
initializeWebSocket(httpServer);

// Start Server (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
        console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
}

export default app;
