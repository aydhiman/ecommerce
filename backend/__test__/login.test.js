import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

describe('Login Tests', () => {
  let testUser;
  let testSeller;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ecommerce-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Seller.deleteMany({});

    // Create test user
    testUser = new User({
      name: 'Test User',
      phone: '9876543210',
      password: 'testpass123',
      address: '123 Test Street'
    });
    await testUser.save();

    // Create test seller
    testSeller = new Seller({
      name: 'Test Seller',
      email: 'testseller@example.com',
      password: 'sellerpass123'
    });
    await testSeller.save();
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Seller.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login - User Login', () => {
    test('should login user successfully with valid credentials', async () => {
      const loginData = {
        phone: '9876543210',
        password: 'testpass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.phone).toBe(loginData.phone);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should not login with incorrect password', async () => {
      const loginData = {
        phone: '9876543210',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    test('should not login with non-existent phone number', async () => {
      const loginData = {
        phone: '1111111111',
        password: 'testpass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    test('should not login with missing phone number', async () => {
      const loginData = {
        password: 'testpass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should not login with missing password', async () => {
      const loginData = {
        phone: '9876543210',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not login with empty credentials', async () => {
      const loginData = {
        phone: '',
        password: '',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return valid JWT token on successful login', async () => {
      const loginData = {
        phone: '9876543210',
        password: 'testpass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeTruthy();
      expect(typeof response.body.token).toBe('string');
      // JWT token should have 3 parts separated by dots
      expect(response.body.token.split('.').length).toBe(3);
    });
  });

  describe('POST /api/auth/seller/login - Seller Login', () => {
    test('should login seller successfully with valid credentials', async () => {
      const loginData = {
        email: 'testseller@example.com',
        password: 'sellerpass123'
      };

      const response = await request(app)
        .post('/api/auth/seller/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.role).toBe('seller');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should not login seller with incorrect password', async () => {
      const loginData = {
        email: 'testseller@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/seller/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    test('should not login seller with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'sellerpass123'
      };

      const response = await request(app)
        .post('/api/auth/seller/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    it('should not login seller with missing email', async () => {
      const loginData = {
        password: 'seller123',
      };

      const response = await request(app)
        .post('/api/auth/seller/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not login seller with missing password', async () => {
      const loginData = {
        email: 'testseller@example.com',
      };

      const response = await request(app)
        .post('/api/auth/seller/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return valid JWT token on successful seller login', async () => {
      const loginData = {
        email: 'testseller@example.com',
        password: 'sellerpass123'
      };

      const response = await request(app)
        .post('/api/auth/seller/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeTruthy();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.').length).toBe(3);
    });
  });

  describe('GET /api/auth/me - Get Current User', () => {
    test('should get current user info with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ phone: '9876543210', password: 'testpass123' });

      const token = loginResponse.body.token;

      // Get current user info
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.phone).toBe('9876543210');
      expect(response.body.user.role).toBe('user');
    });

    test('should not get user info without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should not get user info with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should get current seller info with valid token', async () => {
      // First login as seller to get token
      const loginResponse = await request(app)
        .post('/api/auth/seller/login')
        .send({ email: 'testseller@example.com', password: 'sellerpass123' });

      const token = loginResponse.body.token;

      // Get current seller info
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('testseller@example.com');
      expect(response.body.user.role).toBe('seller');
    });
  });

  describe('POST /api/auth/logout - Logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Logged out');
    });
  });
});