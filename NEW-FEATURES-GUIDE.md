# New Features Implementation Guide

## Overview
This document describes the new features added to the E-Commerce platform:
1. **Admin Panel** - Manage users and sellers with password reset capabilities
2. **Community Section** - Real-time notifications system using WebSockets

---

## 🔐 Admin Panel

### Features
- **Admin Authentication**: Secure login system for administrators
- **User Management**: View all users, reset passwords, activate/deactivate accounts
- **Seller Management**: View all sellers, reset passwords, manage seller status
- **Dashboard Statistics**: Real-time stats for users and sellers
- **Permission-based Access**: Granular permission system for different admin roles

### Setup Admin Account

1. Run the admin creation script:
```bash
cd backend
node create-admin.js
```

Default credentials:
- **Email**: admin@ecommerce.com
- **Password**: admin123
- ⚠️ **Change this password immediately after first login!**

### Admin Routes

#### Backend API Endpoints
- `POST /api/admin/login` - Admin login
- `POST /api/admin/register` - Create new admin (superadmin only)
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/sellers` - Get all sellers (paginated)
- `POST /api/admin/users/:userId/reset-password` - Reset user password
- `POST /api/admin/sellers/:sellerId/reset-password` - Reset seller password
- `PATCH /api/admin/users/:userId/toggle-status` - Activate/deactivate user
- `PATCH /api/admin/sellers/:sellerId/toggle-status` - Activate/deactivate seller
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/profile` - Get admin profile

#### Frontend Routes
- `/admin/login` - Admin login page
- `/admin/dashboard` - Admin dashboard with user and seller management

### Admin Permissions
```javascript
{
  canResetPasswords: true,     // Can reset user/seller passwords
  canManageUsers: true,        // Can view and manage users
  canManageSellers: true,      // Can view and manage sellers
  canManageProducts: false,    // Can manage products (optional)
  canViewReports: true         // Can view reports (optional)
}
```

---

## 📢 Community Section (WebSocket Notifications)

### Features
- **Real-time Notifications**: Sellers can send instant notifications to buyers
- **WebSocket Integration**: Live updates without page refresh
- **Notification Types**: Announcements, Promotions, Updates, Alerts
- **Priority Levels**: Low, Medium, High
- **User Preferences**: Buyers can customize notification settings
- **Mute Sellers**: Buyers can mute notifications from specific sellers
- **Read Tracking**: Track which notifications have been read
- **Statistics**: View delivery and read stats for sent notifications

### Backend Implementation

#### Models
1. **Notification**: Stores notification details sent by sellers
2. **UserNotificationPreference**: Stores buyer notification preferences
3. **Admin**: Admin user model with permissions

#### WebSocket Server
- Location: `backend/websocket/handler.js`
- Connection URL: `ws://localhost:5000?token=YOUR_JWT_TOKEN`
- Auto-reconnection support
- Real-time message broadcasting

#### API Endpoints

**Seller Endpoints:**
- `POST /api/community/notifications` - Send notification
- `GET /api/community/my-notifications` - Get sent notifications
- `DELETE /api/community/notifications/:id` - Delete notification

**Buyer Endpoints:**
- `GET /api/community/notifications` - Get all notifications (filtered by preferences)
- `POST /api/community/notifications/:id/read` - Mark notification as read
- `GET /api/community/preferences` - Get notification preferences
- `PUT /api/community/preferences` - Update preferences
- `POST /api/community/mute-seller/:sellerId` - Mute/unmute seller

### Frontend Implementation

#### Seller Community Page (`/seller/community`)
- Send notifications to buyers
- View sent notification history
- Track notification statistics (sent, delivered, read)
- Delete notifications
- Real-time connection status indicator

#### Buyer Community Page (`/community`)
- View all notifications in real-time
- Mark notifications as read
- Customize notification preferences
- Mute/unmute specific sellers
- Filter notifications by type
- Connection status indicator

### WebSocket Message Format

**Connection:**
```javascript
const ws = new WebSocket(`ws://localhost:5000?token=${JWT_TOKEN}`);
```

**Server Messages:**
```javascript
// New notification broadcast
{
  type: 'new_notification',
  notification: {
    id: 'notification_id',
    sellerId: 'seller_id',
    sellerName: 'Seller Name',
    title: 'Notification Title',
    message: 'Notification Message',
    type: 'announcement|promotion|update|alert',
    priority: 'low|medium|high',
    createdAt: '2025-12-22T...'
  }
}

// Connection established
{
  type: 'connection_established',
  message: 'Connected to notification service',
  clientId: 'user_xxx'
}
```

**Client Messages:**
```javascript
// Ping-pong for connection health
{ type: 'ping' }

// Subscribe to channels (optional)
{ type: 'subscribe', channel: 'channel_name' }
```

---

## 🚀 Installation & Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Create Admin Account
```bash
cd backend
node create-admin.js
```

### 3. Start the Application

**Backend (with WebSocket support):**
```bash
cd backend
npm start
```

The server will start on `http://localhost:5000` with WebSocket support on `ws://localhost:5000`

**Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

---

## 📝 Usage Guide

### For Admins

1. **Login**: Navigate to `/admin/login`
2. **View Dashboard**: See statistics and manage users/sellers
3. **Reset Password**: Click "Reset Password" button for any user/seller
4. **Toggle Status**: Activate or deactivate accounts

### For Sellers

1. **Access Community**: Navigate to `/seller/community`
2. **Send Notification**:
   - Fill in title and message
   - Select type (announcement, promotion, update, alert)
   - Choose target audience
   - Set priority
   - Click "Send Notification"
3. **View History**: See all sent notifications with statistics
4. **Delete Notification**: Remove unwanted notifications

### For Buyers

1. **Access Notifications**: Navigate to `/community`
2. **View Notifications**: See all notifications from sellers
3. **Mark as Read**: Click on unread notifications
4. **Manage Preferences**:
   - Enable/disable notifications
   - Toggle notification types
   - Mute specific sellers

---

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:
```env
# Existing variables
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000

# Redis (optional for caching)
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### WebSocket Configuration

The WebSocket server runs on the same port as the Express server. No additional configuration needed.

---

## 🧪 Testing

### Test Admin Login
```bash
# Use the default credentials
Email: admin@ecommerce.com
Password: admin123
```

### Test WebSocket Connection
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:5000?token=YOUR_JWT_TOKEN');
ws.onmessage = (event) => console.log('Received:', event.data);
```

### Test Notification Flow
1. Login as seller
2. Go to `/seller/community`
3. Send a notification
4. Login as buyer (different browser/incognito)
5. Go to `/community`
6. See real-time notification appear

---

## 📊 Database Schema

### Admin Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'superadmin',
  isActive: Boolean,
  permissions: {
    canResetPasswords: Boolean,
    canManageUsers: Boolean,
    canManageSellers: Boolean,
    canManageProducts: Boolean,
    canViewReports: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Collection
```javascript
{
  sellerId: ObjectId (ref: Seller),
  title: String,
  message: String,
  type: 'announcement' | 'promotion' | 'update' | 'alert',
  targetAudience: 'all' | 'buyers' | 'followers',
  priority: 'low' | 'medium' | 'high',
  status: 'draft' | 'sent' | 'scheduled',
  stats: {
    sent: Number,
    delivered: Number,
    read: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### UserNotificationPreference Collection
```javascript
{
  userId: ObjectId (ref: User),
  enableNotifications: Boolean,
  mutedSellers: [ObjectId],
  preferences: {
    announcements: Boolean,
    promotions: Boolean,
    updates: Boolean,
    alerts: Boolean
  },
  readNotifications: [{
    notificationId: ObjectId,
    readAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Next Steps

1. **Change default admin password**
2. **Test all features in development**
3. **Configure production WebSocket URLs**
4. **Set up monitoring for WebSocket connections**
5. **Implement notification scheduling (future enhancement)**
6. **Add email notifications (future enhancement)**
7. **Implement push notifications for mobile (future enhancement)**

---

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Ensure backend server is running
- Check JWT token is valid
- Verify CORS settings allow WebSocket connections
- Check firewall settings

### Admin Can't Login
- Verify admin account was created using `create-admin.js`
- Check MongoDB connection
- Verify JWT_SECRET is set

### Notifications Not Appearing
- Check WebSocket connection status
- Verify buyer preferences allow notifications
- Check seller hasn't been muted
- Ensure notification type is enabled in preferences

---

## 📚 API Documentation

For detailed API documentation, refer to:
- Backend routes in `backend/routes/`
- WebSocket handler in `backend/websocket/handler.js`
- Frontend API calls in `frontend/src/pages/`

---

## ✅ Feature Checklist

- [x] Admin model and authentication
- [x] Admin login page
- [x] Admin dashboard with user/seller management
- [x] Password reset functionality
- [x] User/seller status toggle
- [x] WebSocket server integration
- [x] Notification model and API
- [x] Seller notification sending interface
- [x] Buyer notification viewing interface
- [x] Real-time notification delivery
- [x] Notification preferences
- [x] Mute sellers feature
- [x] Read tracking
- [x] Statistics and analytics
- [x] Connection status indicators

---

## 📞 Support

For issues or questions, please check:
1. Console logs in browser DevTools
2. Backend server logs
3. MongoDB connection status
4. WebSocket connection status

---

**Happy coding! 🚀**
