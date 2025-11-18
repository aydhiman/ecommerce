import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

describe('User Registration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ecommerce-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    // Wait for MongoDB connection to be fully ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => mongoose.connection.once('open', resolve));
    }
    // Clean up database before tests
    await User.deleteMany({});
    await Seller.deleteMany({});
    
    // Wait a bit to ensure everything is initialized
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register - User Registration', () => {
    test('should register a new user successfully with valid data', async () => {
      const userData = {
        name: 'Test User',
        phone: '1234567890',  // Different from login tests
        password: 'testpass123',
        address: '123 Test Street, Test City'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
        
      if (response.status !== 201) {
        console.log('Test failed with status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.phone).toBe(userData.phone);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should not register user with existing phone number', async () => {
      const userData = {
        name: 'Duplicate User',
        phone: '1234567890', // Same as above
        password: 'testpass123',
        address: '456 Another Street'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already in use');
    });

    test('should not register user with invalid phone number (too short)', async () => {
      const userData = {
        name: 'Invalid Phone User',
        phone: '123',
        password: 'testpass123',
        address: '789 Test Avenue'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should not register user with short password', async () => {
      const userData = {
        name: 'Short Pass User',
        phone: '9876543211',
        password: '123',
        address: '789 Test Avenue'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('at least 6 characters');
    });

    test('should not register user with missing required fields', async () => {
      const userData = {
        name: 'Incomplete User',
        phone: '9876543212'
        // Missing password and address
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should not register user with short name', async () => {
      const userData = {
        name: 'A',
        phone: '9876543213',
        password: 'testpass123',
        address: '789 Test Avenue'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('at least 2 characters');
    });

    test('should not register user with short address', async () => {
      const userData = {
        name: 'Test User',
        phone: '9876543214',
        password: 'testpass123',
        address: 'ABC'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('at least 5 characters');
    });
  });

  describe('POST /api/auth/seller/register - Seller Registration', () => {
    afterAll(async () => {
      await Seller.deleteMany({});
    });

    test('should register a new seller successfully with valid data', async () => {
      const sellerData = {
        name: 'Test Seller',
        email: 'registertest@example.com',  // Different from login tests
        password: 'sellerpass123'
      };

      const response = await request(app)
        .post('/api/auth/seller/register')
        .send(sellerData);
        
      if (response.status !== 201) {
        console.log('Seller test failed with status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(sellerData.name);
      expect(response.body.user.email).toBe(sellerData.email);
      expect(response.body.user.role).toBe('seller');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should not register seller with existing email', async () => {
      const sellerData = {
        name: 'Duplicate Seller',
        email: 'registertest@example.com', // Same as above
        password: 'sellerpass123'
      };

      const response = await request(app)
        .post('/api/auth/seller/register')
        .send(sellerData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already in use');
    });

    test('should not register seller with invalid email format', async () => {
      const sellerData = {
        name: 'Invalid Email Seller',
        email: 'notanemail',
        password: 'sellerpass123'
      };

      const response = await request(app)
        .post('/api/auth/seller/register')
        .send(sellerData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    test('should not register seller with short password', async () => {
      const sellerData = {
        name: 'Short Pass Seller',
        email: 'shortpass@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/seller/register')
        .send(sellerData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('at least 6 characters');
    });

    test('should not register seller with missing required fields', async () => {
      const sellerData = {
        name: 'Incomplete Seller'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/auth/seller/register')
        .send(sellerData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});