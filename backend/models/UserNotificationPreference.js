import mongoose from "mongoose";

const UserNotificationPreference_Schema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  enableNotifications: { type: Boolean, default: true },
  mutedSellers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seller' 
  }],
  preferences: {
    announcements: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    updates: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true }
  },
  readNotifications: [{
    notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification' },
    readAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const UserNotificationPreference = mongoose.model("UserNotificationPreference", UserNotificationPreference_Schema);
export default UserNotificationPreference;
