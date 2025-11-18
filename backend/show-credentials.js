import mongoose from 'mongoose';
import User from './models/User.js';
import Seller from './models/Seller.js';
import Product from './models/Product.js';

await mongoose.connect('mongodb://localhost:27017/ecommerce');

console.log('\n========================================');
console.log('     DATABASE RESTORE COMPLETE');
console.log('========================================\n');

const userCount = await User.countDocuments();
const sellerCount = await Seller.countDocuments();
const productCount = await Product.countDocuments();

console.log('📊 Current Database Status:');
console.log(`   Users: ${userCount}`);
console.log(`   Sellers: ${sellerCount}`);
console.log(`   Products: ${productCount}\n`);

console.log('========================================');
console.log('     LOGIN CREDENTIALS');
console.log('========================================\n');

const user = await User.findOne().select('-password');
if (user) {
  console.log('👤 USER LOGIN:');
  console.log(`   Phone: ${user.phone}`);
  console.log(`   Password: password123`);
  console.log(`   Name: ${user.name}\n`);
}

const seller = await Seller.findOne().select('-password');
if (seller) {
  console.log('🏪 SELLER LOGIN:');
  console.log(`   Email: ${seller.email}`);
  console.log(`   Password: password123`);
  console.log(`   Name: ${seller.name}\n`);
}

console.log('========================================\n');
console.log('✅ Your database has been restored!');
console.log('   You can now login to the application.\n');

await mongoose.connection.close();
