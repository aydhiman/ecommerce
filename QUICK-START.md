# Quick Start Guide - New Features

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies
Since you may have script execution restrictions, you have two options:

**Option A: Using PowerShell with elevated privileges**
```powershell
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd "d:\Bee Projects\ecommerce\backend"
npm install
cd ..\frontend
npm install
```

**Option B: Using CMD**
```cmd
cd "d:\Bee Projects\ecommerce\backend"
npm install
cd ..\frontend
npm install
```

### Step 2: Create Admin Account
```cmd
cd "d:\Bee Projects\ecommerce\backend"
node create-admin.js
```

This will create a default admin:
- Email: `admin@ecommerce.com`
- Password: `admin123`

### Step 3: Start Backend Server
```cmd
cd "d:\Bee Projects\ecommerce\backend"
npm start
```

Server will run on: `http://localhost:5000` with WebSocket support

### Step 4: Start Frontend
Open a new terminal:
```cmd
cd "d:\Bee Projects\ecommerce\frontend"
npm run dev
```

Frontend will run on: `http://localhost:3000`

---

## 🎯 Test the New Features

### Test Admin Panel

1. **Open browser**: Go to `http://localhost:3000/admin/login`
2. **Login with**:
   - Email: `admin@ecommerce.com`
   - Password: `admin123`
3. **You should see**:
   - Dashboard with statistics
   - Users tab with all registered users
   - Sellers tab with all registered sellers
   - Reset password buttons
   - Activate/Deactivate buttons

### Test Community/Notifications

#### As a Seller:
1. **Register/Login as seller**: Go to seller registration/login
2. **Navigate to**: `http://localhost:3000/seller/community`
3. **Send a notification**:
   - Fill in title: "New Product Launch!"
   - Message: "Check out our latest products"
   - Type: Promotion
   - Priority: High
   - Click "Send Notification"
4. **Check connection status**: Green dot = Connected

#### As a Buyer:
1. **Register/Login as buyer**: Normal user registration/login
2. **Navigate to**: `http://localhost:3000/community`
3. **You should see**:
   - Real-time notification appear (if seller sent one)
   - Green "Live Updates Active" indicator
   - Notification preferences panel
4. **Try interactions**:
   - Click on notification to mark as read
   - Toggle notification preferences
   - Test different notification types

---

## 📋 Feature Summary

### ✅ Admin Panel Features
- ✓ Secure admin login
- ✓ View all users and sellers
- ✓ Reset passwords for any user/seller
- ✓ Activate/deactivate accounts
- ✓ Dashboard statistics
- ✓ Pagination for large lists

### ✅ Community Features
- ✓ Real-time WebSocket notifications
- ✓ Sellers can broadcast to buyers
- ✓ Notification types: Announcement, Promotion, Update, Alert
- ✓ Priority levels: Low, Medium, High
- ✓ Buyer notification preferences
- ✓ Mute specific sellers
- ✓ Read/unread tracking
- ✓ Connection status indicators
- ✓ Statistics (sent, delivered, read)

---

## 🔍 Verify Everything Works

### Check Backend Server:
```
✅ MongoDB connected
✅ Redis connected (optional)
✅ Backend API running on http://localhost:5000
✅ WebSocket server running on ws://localhost:5000
```

### Check Frontend:
```
✅ Frontend running on http://localhost:3000
✅ All pages accessible
✅ Navigation updated with new links
```

### Check Database:
Your MongoDB should now have these collections:
- `users` - Buyer accounts
- `sellers` - Seller accounts
- `admins` - Admin accounts (new)
- `products` - Products
- `orders` - Orders
- `carts` - Shopping carts
- `notifications` - Sent notifications (new)
- `usernotificationpreferences` - Buyer preferences (new)

---

## 🐛 Common Issues & Solutions

### Issue: PowerShell script execution disabled
**Solution**: Use CMD instead or run PowerShell as admin and use:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Issue: WebSocket not connecting
**Solution**: 
- Check if backend is running
- Verify JWT token is valid
- Check browser console for errors
- Try refreshing the page

### Issue: Admin login fails
**Solution**:
- Make sure you ran `node create-admin.js`
- Check MongoDB connection
- Verify credentials are correct

### Issue: Notifications not appearing
**Solution**:
- Check WebSocket connection status (green dot)
- Verify buyer has notifications enabled in preferences
- Check if seller is not muted
- Look at browser console for errors

---

## 📱 Test Scenarios

### Scenario 1: Password Reset Flow
1. Login as admin
2. Go to Users tab
3. Click "Reset Password" for a user
4. Enter new password: `newpass123`
5. Logout admin
6. Try logging in as that user with new password

### Scenario 2: Real-time Notification
1. Open two browsers (or one regular + one incognito)
2. Browser 1: Login as seller, go to community
3. Browser 2: Login as buyer, go to community
4. Browser 1: Send a notification
5. Browser 2: Should see notification appear instantly

### Scenario 3: Notification Preferences
1. Login as buyer
2. Go to community page
3. Toggle "Promotions" off
4. Have seller send promotion
5. Verify you don't see it
6. Toggle back on, refresh
7. Verify you now see promotion notifications

---

## 🎨 UI/UX Highlights

### Admin Dashboard
- Clean, modern interface
- Color-coded status badges
- Easy-to-use action buttons
- Responsive tables
- Pagination for large lists

### Seller Community
- Simple form for sending notifications
- Real-time connection indicator
- History of sent notifications
- Statistics dashboard
- Delete functionality

### Buyer Community
- Live notification feed
- Unread badges
- Click to mark as read
- Comprehensive preferences panel
- Toggle switches for easy control

---

## 📊 What's New in Your Codebase

### Backend Files Added:
```
backend/
  models/
    Admin.js ← Admin user model
    Notification.js ← Notification data
    UserNotificationPreference.js ← User preferences
  routes/
    admin.js ← Admin API endpoints
    community.js ← Notification API endpoints
  websocket/
    handler.js ← WebSocket server logic
  create-admin.js ← Admin creation script
```

### Frontend Files Added:
```
frontend/src/pages/
  AdminLogin.jsx ← Admin login page
  AdminDashboard.jsx ← Admin panel
  AdminDashboard.css ← Admin styles
  SellerCommunity.jsx ← Seller notification page
  BuyerCommunity.jsx ← Buyer notification page
  Community.css ← Community styles
```

### Modified Files:
```
backend/
  server.js ← Added WebSocket support
  package.json ← Added 'ws' dependency
frontend/src/
  App.jsx ← Added new routes
  components/layout/Navbar.jsx ← Added navigation links
package.json ← Added 'ws' dependency
```

---

## 🎓 Learning Points

### WebSocket Integration
- Connection established via JWT token in query params
- Real-time bidirectional communication
- Automatic reconnection handling
- Message broadcasting to specific user groups

### Admin System
- Role-based access control
- Permission-based features
- Secure password hashing
- Superadmin vs regular admin

### Notification System
- Publisher-subscriber pattern
- User preference filtering
- Read state tracking
- Statistics aggregation

---

## 🚀 Next Steps

1. **Change admin password** (Important!)
2. **Test all features thoroughly**
3. **Customize notification types** if needed
4. **Add more admin permissions** as required
5. **Configure for production** when ready

---

## 📞 Need Help?

Check these files for reference:
- `NEW-FEATURES-GUIDE.md` - Comprehensive documentation
- Backend routes in `backend/routes/`
- WebSocket handler in `backend/websocket/handler.js`
- Frontend pages in `frontend/src/pages/`

---

**All features are ready to use! Start testing and enjoy! 🎉**
