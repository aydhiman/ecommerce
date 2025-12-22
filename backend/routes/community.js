import express from 'express';
import Notification from '../models/Notification.js';
import UserNotificationPreference from '../models/UserNotificationPreference.js';
import { authMiddleware } from '../middleware/auth.js';
import { broadcastToUsers } from '../websocket/handler.js';

const router = express.Router();

// Create notification (Seller only)
router.post('/notifications', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can create notifications' });
    }
    
    const { title, message, type, targetAudience, priority, metadata } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    const notification = new Notification({
      sellerId: req.user._id,
      title,
      message,
      type: type || 'announcement',
      targetAudience: targetAudience || 'all',
      priority: priority || 'medium',
      metadata: metadata || {}
    });
    
    await notification.save();
    await notification.populate('sellerId', 'name email');
    
    // Broadcast via WebSocket
    broadcastToUsers({
      type: 'new_notification',
      notification: {
        id: notification._id,
        sellerId: notification.sellerId._id,
        sellerName: notification.sellerId.name,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt
      }
    });
    
    // Update stats
    notification.stats.sent += 1;
    await notification.save();
    
    res.status(201).json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get notifications for buyers
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({ error: 'This endpoint is for buyers only' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get user preferences
    let prefs = await UserNotificationPreference.findOne({ userId: req.user._id });
    
    // Build query based on preferences
    let query = { status: 'sent' };
    
    if (prefs) {
      if (!prefs.enableNotifications) {
        return res.json({ notifications: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
      
      // Filter out muted sellers
      if (prefs.mutedSellers.length > 0) {
        query.sellerId = { $nin: prefs.mutedSellers };
      }
      
      // Filter by notification type preferences
      const enabledTypes = Object.entries(prefs.preferences)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => type.replace(/s$/, '')); // Remove plural 's'
      
      if (enabledTypes.length > 0 && enabledTypes.length < 4) {
        query.type = { $in: enabledTypes };
      }
    }
    
    const notifications = await Notification.find(query)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments(query);
    
    // Mark notifications as read
    const readNotificationIds = prefs?.readNotifications.map(r => r.notificationId.toString()) || [];
    
    const notificationsWithReadStatus = notifications.map(notif => ({
      ...notif.toObject(),
      isRead: readNotificationIds.includes(notif._id.toString())
    }));
    
    res.json({
      notifications: notificationsWithReadStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get seller's sent notifications
router.get('/my-notifications', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can access this endpoint' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments({ sellerId: req.user._id });
    
    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get seller notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.post('/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({ error: 'This endpoint is for buyers only' });
    }
    
    const { notificationId } = req.params;
    
    let prefs = await UserNotificationPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      prefs = new UserNotificationPreference({ userId: req.user._id });
    }
    
    const alreadyRead = prefs.readNotifications.some(
      r => r.notificationId.toString() === notificationId
    );
    
    if (!alreadyRead) {
      prefs.readNotifications.push({
        notificationId,
        readAt: new Date()
      });
      await prefs.save();
      
      // Update notification stats
      await Notification.findByIdAndUpdate(notificationId, {
        $inc: { 'stats.read': 1 }
      });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update user notification preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({ error: 'This endpoint is for buyers only' });
    }
    
    const { enableNotifications, preferences } = req.body;
    
    let prefs = await UserNotificationPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      prefs = new UserNotificationPreference({ userId: req.user._id });
    }
    
    if (enableNotifications !== undefined) {
      prefs.enableNotifications = enableNotifications;
    }
    
    if (preferences) {
      prefs.preferences = { ...prefs.preferences, ...preferences };
    }
    
    await prefs.save();
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: prefs
    });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mute/unmute a seller
router.post('/mute-seller/:sellerId', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({ error: 'This endpoint is for buyers only' });
    }
    
    const { sellerId } = req.params;
    const { mute } = req.body; // true to mute, false to unmute
    
    let prefs = await UserNotificationPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      prefs = new UserNotificationPreference({ userId: req.user._id });
    }
    
    if (mute) {
      if (!prefs.mutedSellers.includes(sellerId)) {
        prefs.mutedSellers.push(sellerId);
      }
    } else {
      prefs.mutedSellers = prefs.mutedSellers.filter(
        id => id.toString() !== sellerId
      );
    }
    
    await prefs.save();
    
    res.json({
      message: mute ? 'Seller muted successfully' : 'Seller unmuted successfully',
      mutedSellers: prefs.mutedSellers
    });
  } catch (err) {
    console.error('Mute seller error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({ error: 'This endpoint is for buyers only' });
    }
    
    let prefs = await UserNotificationPreference.findOne({ userId: req.user._id })
      .populate('mutedSellers', 'name email');
    
    if (!prefs) {
      prefs = new UserNotificationPreference({ userId: req.user._id });
      await prefs.save();
    }
    
    res.json({ preferences: prefs });
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete notification (Seller only)
router.delete('/notifications/:notificationId', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can delete notifications' });
    }
    
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      sellerId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await notification.deleteOne();
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
