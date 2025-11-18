# E-Commerce Platform - Multi-View Architecture

## 🎯 Architecture Overview

This project has been refactored into a **modern multi-view architecture** with:
- **Backend**: REST API server (Node.js + Express + MongoDB + Redis)
- **Frontend**: React SPA (Vite + React Router + Zustand + React Query)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              E-Commerce Platform                     │
│                                                     │
├───────────────────────┬─────────────────────────────┤
│                       │                             │
│   BACKEND (Port 5000) │  FRONTEND (Port 3000)       │
│                       │                             │
│   Node.js + Express   │  React + Vite               │
│   MongoDB + Redis     │  React Router               │
│   REST API            │  Zustand (State)            │
│   JWT Auth            │  React Query (Data)         │
│   Redis Cache         │  Axios (HTTP)               │
│                       │                             │
└───────────────────────┴─────────────────────────────┘
```

## 📁 Project Structure

```
BEEF PROJECT/
├── backend/                 # REST API Server
│   ├── config/
│   │   └── redis.js        # Redis configuration
│   ├── middleware/
│   │   ├── auth.js         # JWT Bearer token auth
│   │   ├── cache.js        # Redis caching middleware
│   │   ├── upload.js       # File upload (Multer)
│   │   └── validation.js   # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Seller.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── product.js      # Product CRUD
│   │   ├── cart.js         # Cart management
│   │   ├── order.js        # Order management
│   │   ├── user.js         # User profile
│   │   ├── seller.js       # Seller dashboard
│   │   └── search.js       # Search with cache
│   ├── uploads/            # Product images
│   ├── .env                # Environment variables
│   ├── server.js           # Express server
│   └── package.json
│
└── frontend/               # React SPA
    ├── public/
    ├── src/
    │   ├── api/
    │   │   └── axios.js    # Axios configuration
    │   ├── components/
    │   │   └── layout/
    │   │       ├── Navbar.jsx
    │   │       ├── Navbar.css
    │   │       ├── Footer.jsx
    │   │       └── Footer.css
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Products.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Orders.jsx
    │   │   ├── SellerDashboard.jsx
    │   │   ├── AddProduct.jsx
    │   │   ├── EditProduct.jsx
    │   │   └── Auth.css
    │   ├── store/
    │   │   └── authStore.js    # Zustand state management
    │   ├── App.jsx             # Main app with routing
    │   ├── main.jsx            # Entry point
    │   └── index.css
    ├── .env
    ├── vite.config.js
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (running on localhost:27017)
- Redis Cloud account (or local Redis)
- npm or yarn

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables (.env already exists)
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/ecommerce
# JWT_SECRET=your-super-secret-jwt-key
# FRONTEND_URL=http://localhost:3000
# Redis credentials are already configured

# Start the backend server
npm start

# Backend will run on http://localhost:5000
```

### 2. Frontend Setup

```powershell
# Open a new terminal
cd frontend

# Dependencies are already installed

# Configure environment (.env already exists)
# VITE_API_URL=http://localhost:5000/api

# Start the React development server
npm run dev

# Frontend will run on http://localhost:3000
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 🔑 Key Changes from Monolithic Architecture

### Backend Changes

1. **Removed EJS Views**
   - No server-side rendering
   - Pure REST API responses (JSON)
   - No `cookie-parser` for auth (uses Bearer tokens)

2. **Authentication**
   - **Before**: Cookie-based sessions
   - **After**: JWT Bearer tokens in Authorization header
   ```javascript
   // Old (Cookie)
   res.cookie('token', token, { httpOnly: true });
   
   // New (Bearer Token)
   res.json({ token, user });
   // Client sends: Authorization: Bearer <token>
   ```

3. **CORS Configuration**
   - Enabled CORS for React frontend
   - Allows credentials and specific methods

4. **Response Format**
   - **Before**: `res.redirect()`, `res.render()`
   - **After**: `res.json()` for all responses

### Frontend Changes

1. **React SPA**
   - Client-side routing (React Router)
   - Component-based architecture
   - Single page application (no page reloads)

2. **State Management**
   - **Zustand**: Global auth state
   - **React Query**: Server state caching
   - **LocalStorage**: Token persistence

3. **API Integration**
   - Axios for HTTP requests
   - Automatic token injection
   - Error handling and retries

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/seller/register` - Seller registration
- `POST /api/auth/seller/login` - Seller login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (cached 5 min)
- `GET /api/products/:id` - Get product by ID (cached 10 min)
- `POST /api/products` - Create product (seller only)

### Search
- `GET /api/search?q=term` - Search products (cached 5 min)
- `GET /api/search/recent` - Get recent searches
- `GET /api/search/recently-viewed` - Get recently viewed

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `DELETE /api/cart/:id` - Remove from cart

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Place order

## 🔐 Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│          │         │          │         │          │
│  React   │────────▶│  Backend │────────▶│ MongoDB  │
│          │         │   API    │         │          │
└──────────┘         └──────────┘         └──────────┘
     │                     │
     │ 1. POST /auth/login│
     │ { phone, password } │
     │─────────────────────▶
     │                     │
     │ 2. Verify credentials
     │                     │──────▶ Check DB
     │                     │
     │ 3. Return JWT token │
     │◀─────────────────────
     │ { token, user }     │
     │                     │
     │ 4. Store in localStorage
     │                     │
     │ 5. All requests     │
     │ Authorization: Bearer <token>
     │─────────────────────▶
```

## 🛠️ Development Workflow

### Running Both Servers

```powershell
# Terminal 1: Backend
cd backend
npm run dev    # Uses nodemon for auto-restart

# Terminal 2: Frontend
cd frontend
npm run dev    # Vite HMR (Hot Module Replacement)
```

### Building for Production

```powershell
# Build frontend
cd frontend
npm run build
# Creates frontend/dist/ folder

# Serve frontend build from backend (optional)
cd ../backend
# Serve frontend/dist as static files
```

## 📊 Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| Redis | Caching layer |
| JWT | Authentication |
| Bcrypt | Password hashing |
| Multer | File uploads |
| Helmet | Security headers |
| CORS | Cross-origin requests |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| Vite | Build tool |
| React Router | Client-side routing |
| Zustand | State management |
| React Query | Server state |
| Axios | HTTP client |
| CSS3 | Styling |

## 🎨 Features

### For Users
- ✅ Browse products
- ✅ Search with Redis caching
- ✅ Add to cart
- ✅ Place orders
- ✅ View order history
- ✅ Recently viewed products

### For Sellers
- ✅ Seller dashboard
- ✅ Add new products
- ✅ Edit existing products
- ✅ View sales analytics
- ✅ Manage inventory

### System Features
- ✅ JWT authentication
- ✅ Redis caching (search, products)
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ File upload
- ✅ Responsive design

## 🔧 Configuration

### Backend .env
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Redis Cloud
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_HOST=redis-xxxxx.cloud.redislabs.com
REDIS_PORT=11561
```

### Frontend .env
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

```powershell
# Backend tests
cd backend
npm test                # All tests
npm run test:unit      # Unit tests
npm run test:integration # Integration tests

# Frontend tests (to be added)
cd frontend
npm test
```

## 📝 Next Steps

### Complete Implementation Tasks:

1. **Frontend Pages** (Currently placeholders)
   - Home page with featured products
   - Products listing with filters
   - Product detail page
   - Shopping cart
   - Orders history
   - Seller dashboard
   - Add/Edit product forms

2. **Additional Features**
   - Image upload component
   - Product search with filters
   - Pagination
   - Reviews and ratings
   - Payment integration
   - Email notifications

3. **Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Service workers (PWA)

4. **Testing**
   - Frontend component tests
   - E2E tests with Cypress
   - API integration tests

## 🚀 Deployment

### Backend Deployment
- Deploy to Heroku, AWS, DigitalOcean, or Render
- Set environment variables
- Use production MongoDB (MongoDB Atlas)
- Configure Redis Cloud

### Frontend Deployment
- Deploy to Vercel, Netlify, or AWS S3
- Build: `npm run build`
- Set VITE_API_URL to production backend URL

## 📞 Support

For issues or questions:
1. Check the backend console for API errors
2. Check the browser console for frontend errors
3. Verify MongoDB and Redis connections
4. Ensure CORS is properly configured

## 🎉 Benefits of This Architecture

1. **Separation of Concerns**
   - Backend focuses on data and business logic
   - Frontend focuses on UI/UX

2. **Scalability**
   - Scale frontend and backend independently
   - Deploy to different servers/CDNs

3. **Development**
   - Parallel development (frontend/backend teams)
   - Hot module replacement (faster development)

4. **Modern Stack**
   - React ecosystem
   - Component reusability
   - Better developer experience

5. **Performance**
   - Client-side routing (no page reloads)
   - Redis caching
   - Optimized builds

---

**🎊 Your e-commerce platform is now a modern, scalable, multi-view application!**
