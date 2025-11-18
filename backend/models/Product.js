import mongoose from "mongoose";

const Product_Schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  image: { type: String, default: 'default-product.jpg' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

Product_Schema.index({ name: 'text', description: 'text' });
Product_Schema.index({ category: 1 });
Product_Schema.index({ price: 1 });

const Product = mongoose.model("Product", Product_Schema);
export default Product;