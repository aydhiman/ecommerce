import mongoose from 'mongoose';
import User from './models/User.js';
import Seller from './models/Seller.js';
import Product from './models/Product.js';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/ecommerce');

console.log('\n=== DATABASE STATUS ===\n');

// Check current data
const userCount = await User.countDocuments();
const sellerCount = await Seller.countDocuments();
const productCount = await Product.countDocuments();

console.log(`Users: ${userCount}`);
console.log(`Sellers: ${sellerCount}`);
console.log(`Products: ${productCount}`);

if (userCount === 0 && sellerCount === 0) {
  console.log('\n⚠️  Database is empty! Creating sample data...\n');
  
  // Create sample user
  const user = new User({
    name: 'Test User',
    phone: '9876543210',
    password: 'password123',
    address: '123 Test Street, Test City'
  });
  await user.save();
  console.log('✅ Created sample user (phone: 9876543210, password: password123)');
  
  // Create sample seller
  const seller = new Seller({
    name: 'Test Seller',
    email: 'seller@example.com',
    password: 'password123'
  });
  await seller.save();
  console.log('✅ Created sample seller (email: seller@example.com, password: password123)');
  
  // Create sample products
  const products = [
    {
      name: 'Sample Product 1',
      description: 'This is a sample product for testing',
      price: 99.99,
      category: 'Electronics',
      stock: 10,
      image: 'https://via.placeholder.com/300',
      seller: seller._id
    },
    {
      name: 'Sample Product 2',
      description: 'Another sample product for testing',
      price: 149.99,
      category: 'Clothing',
      stock: 20,
      image: 'https://via.placeholder.com/300',
      seller: seller._id
    }
  ];
  
  await Product.insertMany(products);
  console.log('✅ Created 2 sample products');
  
  console.log('\n=== SAMPLE DATA CREATED ===');
  console.log('\nYou can now login with:');
  console.log('  User: phone 9876543210, password: password123');
  console.log('  Seller: email seller@example.com, password: password123');
} else {
  console.log('\n✅ Database has existing data');
}

await mongoose.connection.close();
console.log('\n✅ Done!\n');
