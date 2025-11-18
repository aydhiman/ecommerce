# Testing Guide

This document provides comprehensive information about testing the E-Commerce Platform.

## Overview

The project includes three types of tests:

1. **Unit Tests** - Test individual components and utilities
2. **Integration Tests** - Test API endpoints with Supertest
3. **E2E Tests** - Test user workflows with Puppeteer

## Prerequisites

Before running tests, ensure you have:

- Node.js installed
- MongoDB running locally or accessible remotely
- Redis server running locally or accessible remotely
- All dependencies installed (`npm install`)

## Installation

Install all testing dependencies:

```bash
npm install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suites

**Unit Tests Only:**
```bash
npm run test:unit
```

**Integration Tests Only:**
```bash
npm run test:integration
```

**E2E Tests Only:**
```bash
npm run test:e2e
```

## Test Structure

```
tests/
├── setup.js                    # Test configuration and setup
├── unit/                       # Unit tests
│   ├── models/
│   │   └── Product.test.js     # Product model tests
│   └── utils/
│       └── cache.test.js       # Redis cache utility tests
├── integration/                # Integration tests with Supertest
│   ├── products.test.js        # Product API tests
│   └── auth.test.js            # Authentication API tests
└── e2e/                        # End-to-end tests with Puppeteer
    ├── homepage.test.js        # Homepage navigation tests
    ├── auth.test.js            # Login/Register flow tests
    └── products.test.js        # Product browsing tests
```

## Redis Integration

### Redis Configuration

Redis is configured in `config/redis.js` with the following features:

- Automatic connection with retry strategy
- Configurable host, port, and password
- Utility functions for cache operations
- Graceful shutdown handling

### Cache Middleware

Two middleware functions are available:

**`cacheMiddleware(ttl)`** - Caches GET request responses
```javascript
import { cacheMiddleware } from './middleware/cache.js';

router.get('/products', cacheMiddleware(300), async (req, res) => {
  // Your route handler
});
```

**`invalidateCache(patterns)`** - Invalidates cache after modifications
```javascript
import { invalidateCache } from './middleware/cache.js';

router.post('/products', invalidateCache(['cache:/api/products*']), async (req, res) => {
  // Your route handler
});
```

### Cache Utility Functions

```javascript
import { cacheUtil } from './config/redis.js';

// Set data in cache
await cacheUtil.set('key', data, 3600);

// Get data from cache
const data = await cacheUtil.get('key');

// Delete specific key
await cacheUtil.del('key');

// Delete keys by pattern
await cacheUtil.delPattern('cache:*');

// Check if key exists
const exists = await cacheUtil.exists('key');

// Flush all cache (use carefully!)
await cacheUtil.flushAll();
```

## Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
NODE_ENV=test
MONGODB_TEST_URI=mongodb://localhost:27017/ecommerce-test
REDIS_TEST_HOST=localhost
REDIS_TEST_PORT=6379
JWT_SECRET=test-secret-key
BASE_URL=http://localhost:3000
```

## Writing Tests

### Unit Test Example

```javascript
import { describe, it, expect } from '@jest/globals';

describe('My Feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

### Integration Test Example

```javascript
import request from 'supertest';
import app from '../app.js';

describe('API Endpoint', () => {
  it('should return data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toBeDefined();
  });
});
```

### E2E Test Example

```javascript
import puppeteer from 'puppeteer';

describe('User Flow', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  it('should navigate correctly', async () => {
    await page.goto('http://localhost:3000');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Cleanup**: Always clean up test data after tests complete
3. **Mocking**: Use mocks for external dependencies when appropriate
4. **Assertions**: Make specific, meaningful assertions
5. **Naming**: Use descriptive test names that explain what is being tested

## Coverage

Test coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD tools

## Troubleshooting

### Tests Timeout
- Increase timeout in `jest.config.js`
- Ensure MongoDB and Redis are running
- Check network connectivity

### Connection Errors
- Verify MongoDB URI in `.env.test`
- Verify Redis configuration
- Check if services are running on correct ports

### E2E Tests Fail
- Ensure the application server is running on the correct port
- Check if Puppeteer can launch Chrome/Chromium
- Verify BASE_URL in `.env.test`

## Continuous Integration

For CI/CD pipelines, ensure:

1. MongoDB test database is available
2. Redis server is running
3. Environment variables are properly set
4. Headless mode is enabled for Puppeteer tests

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Puppeteer Documentation](https://pptr.dev/)
- [Redis Node Client Documentation](https://github.com/redis/ioredis)
