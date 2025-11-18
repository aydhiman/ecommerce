# 🚀 Quick Start Guide - Multi-View Architecture

## ✅ What Was Done

Your project has been **successfully migrated** from a monolithic EJS-based architecture to a modern **multi-view architecture**:

- **Backend**: REST API (Node.js + Express) on port 5000
- **Frontend**: React SPA (Vite) on port 3000

## 🎯 Current Status

✅ **Backend Server**: Running on http://localhost:5000
✅ **Frontend Server**: Running on http://localhost:3000
✅ **MongoDB**: Connected
✅ **Redis**: Connected
✅ **CORS**: Configured
✅ **Authentication**: JWT Bearer tokens
✅ **State Management**: Zustand + React Query

## 📂 Directory Structure

```
BEEF PROJECT/
├── backend/          # REST API (Port 5000)
│   ├── routes/       # API endpoints
│   ├── models/       # Database models
│   ├── middleware/   # Auth, cache, validation
│   ├── config/       # Redis configuration
│   └── server.js     # Express server
│
└── frontend/         # React App (Port 3000)
    ├── src/
    │   ├── pages/    # Route components
    │   ├── components/ # Reusable components
    │   ├── store/    # Zustand state
    │   └── api/      # Axios config
    └── package.json
```

## 🚀 How to Run

### Option 1: Use the Start Script (Recommended)

```powershell
.\start.ps1
```

This opens both servers in separate terminal windows.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:5000/api | REST API endpoints |
| **Health Check** | http://localhost:5000/health | Server status |
| **MongoDB** | localhost:27017 | Database |
| **Redis Cloud** | redis-11561.cloud.redislabs.com | Cache |

## 🔑 Key Features

### Authentication
- JWT Bearer tokens (no cookies)
- Token stored in localStorage
- Automatic token injection in API requests
- Auth state managed by Zustand

### State Management
```javascript
// Global auth state (Zustand)
import useAuthStore from './store/authStore';

const { user, isAuthenticated, login, logout } = useAuthStore();
```

### API Calls
```javascript
// All API calls use Axios with auto token injection
import api from './api/axios';

// GET request
const products = await api.get('/products');

// POST request
const response = await api.post('/auth/login', { phone, password });
```

## 📡 API Examples

### Register User
```javascript
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "1234567890",
  "password": "password123",
  "address": "123 Main St"
}
```

### Login
```javascript
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "phone": "1234567890",
  "password": "password123"
}

Response:
{
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "phone": "1234567890",
    "role": "user"
  }
}
```

### Get Products
```javascript
GET http://localhost:5000/api/products
Authorization: Bearer <token>
```

## 🛠️ Development Workflow

1. **Backend Changes**
   - Edit files in `backend/`
   - Server auto-restarts (if using `npm run dev`)
   - Test with http://localhost:5000/api

2. **Frontend Changes**
   - Edit files in `frontend/src/`
   - Vite HMR updates instantly
   - See changes at http://localhost:3000

3. **Adding New Pages**
   ```javascript
   // 1. Create page component
   frontend/src/pages/NewPage.jsx
   
   // 2. Add route in App.jsx
   <Route path="/new-page" element={<NewPage />} />
   ```

4. **Adding New API Endpoints**
   ```javascript
   // backend/routes/yourRoute.js
   router.get('/endpoint', authMiddleware, async (req, res) => {
     res.json({ data: 'your data' });
   });
   ```

## 🔧 Common Tasks

### Add Authentication to a Route
```javascript
// Backend
import { authMiddleware } from '../middleware/auth.js';
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

### Protect a Frontend Route
```javascript
// App.jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Call API from React Component
```javascript
import api from '../api/axios';

function MyComponent() {
  const fetchData = async () => {
    try {
      const response = await api.get('/products');
      console.log(response.data);
    } catch (error) {
      console.error('Error:', error.response?.data);
    }
  };
}
```

## 🐛 Troubleshooting

### CORS Errors
- **Problem**: "Access to XMLHttpRequest has been blocked by CORS"
- **Solution**: Backend CORS is configured for http://localhost:3000
- **Check**: `backend/server.js` has correct CORS origin

### 401 Unauthorized
- **Problem**: API returns 401
- **Solution**: Token might be expired or invalid
- **Fix**: Logout and login again

### Cannot Connect to Backend
- **Problem**: Frontend can't reach API
- **Solution**: Ensure backend is running on port 5000
- **Check**: Visit http://localhost:5000/health

### Port Already in Use
- **Problem**: "Port 3000 is already in use"
- **Solution**: Kill existing processes
```powershell
taskkill /F /IM node.exe
```

## 📦 Installing New Packages

### Backend
```powershell
cd backend
npm install package-name
```

### Frontend
```powershell
cd frontend
npm install package-name
```

## 🚀 Next Steps to Complete

The architecture is set up! Now you need to implement the page content:

1. **Complete Frontend Pages** (currently placeholders):
   - `Home.jsx` - Hero section, featured products
   - `Products.jsx` - Product grid with filters
   - `ProductDetail.jsx` - Single product view
   - `Cart.jsx` - Shopping cart
   - `Orders.jsx` - Order history
   - `SellerDashboard.jsx` - Seller analytics
   - `AddProduct.jsx` - Product creation form
   - `EditProduct.jsx` - Product edit form

2. **Add Product Components**:
   - ProductCard
   - ProductGrid
   - SearchBar
   - FilterPanel
   - CartItem

3. **Implement Features**:
   - Image upload for products
   - Add to cart functionality
   - Checkout flow
   - Order confirmation
   - Search with filters
   - Pagination

4. **Styling**:
   - Complete responsive design
   - Add loading states
   - Error boundaries
   - Toast notifications

## 📚 Documentation

- **Full Guide**: `ARCHITECTURE-MIGRATION.md`
- **Backend API**: All endpoints documented above
- **Frontend State**: Zustand store in `frontend/src/store/`
- **Routing**: React Router in `frontend/src/App.jsx`

## 🎉 Success Indicators

✅ Both servers running without errors
✅ Frontend loads at http://localhost:3000
✅ Backend responds at http://localhost:5000
✅ MongoDB connected
✅ Redis connected
✅ Login/Register forms visible
✅ Navigation works

---

**🎊 Your multi-view architecture is ready!**

Frontend and backend are separated, allowing independent development and deployment.
