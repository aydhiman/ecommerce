import mongoose from 'mongoose';
import Product from './models/Product.js';
import Seller from './models/Seller.js';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/ecommerce');

console.log('\n=== ADDING SAMPLE PRODUCTS ===\n');

// Get the seller
const seller = await Seller.findOne();

if (!seller) {
  console.log('❌ No seller found. Please run check-and-restore-db.js first');
  process.exit(1);
}

// Check if products already exist
const existingProducts = await Product.countDocuments();
if (existingProducts > 0) {
  console.log(`✅ ${existingProducts} products already exist`);
  await mongoose.connection.close();
  process.exit(0);
}

// Create sample products
const products = [
  {
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 99.99,
    category: 'Electronics',
    stock: 50,
    image: 'https://via.placeholder.com/300',
    seller: seller._id
  },
  {
    name: 'Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt available in multiple colors',
    price: 19.99,
    category: 'Clothing',
    stock: 100,
    image: 'https://via.placeholder.com/300',
    seller: seller._id
  },
  {
    name: 'Laptop Backpack',
    description: 'Durable backpack with laptop compartment',
    price: 49.99,
    category: 'Accessories',
    stock: 30,
    image: 'https://via.placeholder.com/300',
    seller: seller._id
  },
  {
    name: 'Smart Watch',
    description: 'Feature-rich smartwatch with fitness tracking',
    price: 199.99,
    category: 'Electronics',
    stock: 25,
    image: 'https://via.placeholder.com/300',
    seller: seller._id
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight running shoes for comfort and performance',
    price: 89.99,
    category: 'Sports',
    stock: 40,
    image: 'https://via.placeholder.com/300',
    seller: seller._id
  }
];

await Product.insertMany(products);
console.log(`✅ Created ${products.length} sample products`);

await mongoose.connection.close();
console.log('\n✅ Done!\n');
