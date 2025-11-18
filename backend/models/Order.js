import mongoose from "mongoose";

const Order_Schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  totalPrice: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: "pending" 
  },
  shippingAddress: { type: String, required: true }
}, { timestamps: true });

Order_Schema.index({ user: 1 });
Order_Schema.index({ status: 1 });

const Order = mongoose.model("Order", Order_Schema);
export default Order;