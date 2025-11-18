// Jest setup file for ES modules
// Note: jest.setTimeout is not available in setup files with ES modules
// Timeout is configured in jest.config.js instead

import mongoose from 'mongoose';

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

// Suppress console warnings during tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    // Suppress specific warnings if needed
    if (args[0]?.includes?.('ExperimentalWarning')) return;
    originalWarn(...args);
  };
  
  console.error = (...args) => {
    // Suppress Redis connection errors during tests
    if (args[0]?.includes?.('Redis')) return;
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
