import mongoose from "mongoose";

const Notification_Schema = new mongoose.Schema({
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seller',
    required: true,
    index: true
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['announcement', 'promotion', 'update', 'alert'],
    default: 'announcement'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'buyers', 'followers'],
    default: 'all'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'scheduled'],
    default: 'sent'
  },
  scheduledFor: { type: Date },
  metadata: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    link: { type: String },
    imageUrl: { type: String }
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 }
  }
}, { timestamps: true });

Notification_Schema.index({ sellerId: 1, createdAt: -1 });
Notification_Schema.index({ status: 1, scheduledFor: 1 });

const Notification = mongoose.model("Notification", Notification_Schema);
export default Notification;
