import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import productRoutes from './routes/product.js';
import sellerRoutes from './routes/seller.js';
import viewRoutes from './routes/views.js';

// Import middleware
import authMiddleware from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// View engine setup
app.engine('handlebars', engine({
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  extname: '.handlebars',
  helpers: {
    eq: (a, b) => a === b,
    formatDate: (date) => date ? new Date(date).toLocaleDateString() : '',
    multiply: (a, b) => a * b,
    add: (a, b) => a + b
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/seller', authMiddleware, sellerRoutes);
app.use('/', viewRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (req.accepts('html')) {
    res.status(500).render('error', { 
      error: 'Internal Server Error',
      layout: 'layout'
    });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 404 handler
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).render('404', { layout: 'layout' });
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});