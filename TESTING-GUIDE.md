# Testing Guide for New Features

## Project Status: ✅ Running Successfully!

### Servers Running:
- **Backend API**: http://localhost:5000 (with WebSocket support)
- **Frontend**: http://localhost:3000
- **MongoDB**: Connected successfully
- **Redis**: Warning (optional caching - server continues without it)

---

## Quick Testing Steps

### 1. Test Admin Panel

#### Login as Admin:
1. Navigate to: http://localhost:3000/admin/login
2. Use credentials:
   - **Email**: `admin@ecommerce.com`
   - **Password**: `admin123`
3. You should see the Admin Dashboard

#### Test Admin Features:
- ✅ View user statistics
- ✅ View all users in the "Users" tab
- ✅ View all sellers in the "Sellers" tab
- ✅ Reset user password (click "Reset Password" button)
- ✅ Activate/Deactivate user accounts
- ✅ Reset seller password
- ✅ Activate/Deactivate seller accounts

---

### 2. Test Seller Community/Notifications

#### Create a Seller Account (if not exists):
1. Navigate to: http://localhost:3000/register
2. Register as a seller or use existing seller login

#### Send Notifications:
1. Login as seller
2. Navigate to: http://localhost:3000/seller/community
3. Fill in the notification form:
   - **Title**: "Special Sale Today!"
   - **Message**: "Get 50% off on all products!"
   - **Type**: Promotion
   - **Priority**: High
4. Click "Send Notification"
5. ✅ Check if notification appears in "Sent Notifications" section
6. ✅ Check WebSocket connection status (should show "Connected")

---

### 3. Test Buyer Notifications

#### Create/Login as Buyer:
1. Navigate to: http://localhost:3000/register
2. Register as a regular user (buyer)
3. Login with user credentials

#### Receive Notifications:
1. Navigate to: http://localhost:3000/community
2. ✅ You should see notifications sent by sellers
3. ✅ Check WebSocket connection status (should show "Live Updates Active")
4. ✅ Click on unread notifications to mark them as read
5. ✅ Test notification preferences:
   - Toggle "Enable Notifications"
   - Toggle individual notification types
6. ✅ Test real-time updates:
   - Keep buyer page open
   - In another browser/incognito, login as seller
   - Send a new notification from seller
   - Watch it appear instantly on buyer's page!

---

### 4. Test Real-Time WebSocket

#### Setup:
1. Open http://localhost:3000/community (logged in as buyer)
2. Open http://localhost:3000/seller/community in another browser/incognito (logged in as seller)

#### Test Real-Time:
1. From seller page, send a notification
2. ✅ Notification should appear INSTANTLY on buyer page without refresh
3. ✅ Success message should show on both pages
4. ✅ Connection indicators should show "Connected" and "Live Updates Active"

---

## Test API Endpoints with curl/Postman

### Admin Endpoints:

**Login:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecommerce.com","password":"admin123"}'
```

**Get Users:**
```bash
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Reset User Password:**
```bash
curl -X POST http://localhost:5000/api/admin/users/USER_ID/reset-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"newpass123"}'
```

### Community Endpoints:

**Send Notification (Seller):**
```bash
curl -X POST http://localhost:5000/api/community/notifications \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Notification",
    "message":"This is a test",
    "type":"announcement",
    "priority":"medium"
  }'
```

**Get Notifications (Buyer):**
```bash
curl http://localhost:5000/api/community/notifications \
  -H "Authorization: Bearer BUYER_TOKEN"
```

---

## WebSocket Testing with JavaScript

Open browser console and run:

```javascript
// Replace with your actual token
const token = 'YOUR_JWT_TOKEN';
const ws = new WebSocket(`ws://localhost:5000?token=${token}`);

ws.onopen = () => console.log('✅ WebSocket Connected');
ws.onmessage = (event) => console.log('📨 Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('❌ Error:', error);
ws.onclose = () => console.log('🔌 WebSocket Closed');

// Send ping
ws.send(JSON.stringify({ type: 'ping' }));
```

---

## Verification Checklist

### Admin Panel:
- [ ] Admin can login
- [ ] Dashboard shows correct statistics
- [ ] Can view all users
- [ ] Can view all sellers
- [ ] Can reset user passwords
- [ ] Can reset seller passwords
- [ ] Can activate/deactivate accounts
- [ ] Pagination works correctly

### Seller Community:
- [ ] Seller can access community page
- [ ] Can send notifications with all types
- [ ] Sent notifications appear in history
- [ ] Statistics show correctly (sent, delivered, read)
- [ ] Can delete notifications
- [ ] WebSocket shows "Connected" status

### Buyer Community:
- [ ] Buyer can access notifications page
- [ ] Receives notifications from sellers
- [ ] Can mark notifications as read
- [ ] Can toggle notification preferences
- [ ] Can enable/disable specific notification types
- [ ] Real-time updates work without refresh
- [ ] WebSocket shows "Live Updates Active"
- [ ] Unread count displays correctly

### WebSocket Functionality:
- [ ] Connection establishes successfully
- [ ] Connection status indicators work
- [ ] Real-time messages are delivered instantly
- [ ] Multiple clients can connect simultaneously
- [ ] Reconnection works after disconnect
- [ ] Only buyers receive broadcast notifications

---

## Common Issues and Solutions

### Issue: Backend won't start
**Solution**: 
- Check if MongoDB is running
- Verify port 5000 is not in use
- Check if dependencies are installed: `cd backend && npm install`

### Issue: Frontend won't start
**Solution**:
- Verify port 3000 is not in use
- Check if dependencies are installed: `cd frontend && npm install`

### Issue: WebSocket not connecting
**Solution**:
- Ensure backend is running
- Check JWT token is valid
- Look for CORS issues in browser console
- Verify WebSocket URL format: `ws://localhost:5000?token=YOUR_TOKEN`

### Issue: Notifications not appearing in real-time
**Solution**:
- Check WebSocket connection status
- Verify buyer has notifications enabled in preferences
- Check seller hasn't been muted
- Look for errors in browser console

### Issue: Admin can't login
**Solution**:
- Verify admin account was created: `cd backend && node create-admin.js`
- Check credentials: email=admin@ecommerce.com, password=admin123
- Check backend logs for errors

---

## Development Notes

### Redis Warnings:
The Redis connection warnings are **not critical**. The application works fine without Redis - it just won't have caching. You can:
1. Ignore the warnings (recommended for testing)
2. Comment out Redis import in `backend/server.js`
3. Set up a local Redis server or use a cloud Redis service

### Security Notes:
⚠️ **IMPORTANT**: Change the default admin password after first login!

### Performance:
- WebSocket connections are persistent
- Notifications are delivered in real-time
- No database polling required
- Efficient message broadcasting

---

## Next Steps for Production

1. **Security**:
   - Change default admin credentials
   - Add rate limiting for admin endpoints
   - Implement admin password reset flow
   - Add HTTPS for WebSocket (wss://)

2. **Features**:
   - Add notification scheduling
   - Implement email notifications
   - Add file attachments to notifications
   - Create notification templates

3. **Monitoring**:
   - Log WebSocket connections
   - Track notification delivery rates
   - Monitor server performance
   - Set up error tracking

4. **Deployment**:
   - Configure production WebSocket URLs
   - Set up proper environment variables
   - Enable Redis for caching
   - Set up load balancing for WebSocket

---

## Success! 🎉

Your e-commerce platform now has:
✅ **Admin Panel** - Full user and seller management with password reset
✅ **Community Section** - Real-time notifications using WebSockets
✅ **Real-time Updates** - Instant notification delivery to buyers
✅ **Notification Preferences** - Users can customize their experience
✅ **Connection Monitoring** - Live connection status indicators

**Enjoy testing the new features!** 🚀
