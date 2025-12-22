import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');

    // Check if any admin exists
    const existingAdmin = await Admin.findOne();
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('\nIf you forgot the password, you can reset it by modifying this script.');
      process.exit(0);
    }

    // Create default superadmin
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@admin.com',
      password: 'admin123', // Change this password after first login!
      role: 'superadmin',
      permissions: {
        canResetPasswords: true,
        canManageUsers: true,
        canManageSellers: true,
        canManageProducts: true,
        canViewReports: true
      }
    });

    await admin.save();
    
    console.log('✅ Default admin created successfully!');
    console.log('\n📧 Email: admin@admin.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  IMPORTANT: Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createDefaultAdmin();
