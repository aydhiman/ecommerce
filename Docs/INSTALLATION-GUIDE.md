# Quick Installation Guide

## Prerequisites
- Node.js (v16+)
- MongoDB (running locally or remote)
- Redis Cloud account (credentials already configured)

## Step 1: Install Dependencies

```bash
npm install redis
npm install --save-dev @jest/globals jest puppeteer supertest
```

Or install all at once:
```bash
npm install
```

## Step 2: Environment Setup

Your `.env` file already contains Redis Cloud credentials:
```env
REDIS_USERNAME=default
REDIS_PASSWORD=5D7AtwPFigqhvZpk0zB8kLDVFrxrqLv1
REDIS_HOST=redis-11561.c278.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=11561
```

## Step 3: Start the Server

```bash
npm start
```

You should see:
```
✅ Successfully connected to MongoDB
✅ Successfully connected to Redis Cloud
✅ Redis client is ready
🚀 Server is running on http://localhost:8080
```

## Step 4: Test Redis Features

### Test Search (requires authentication):
```bash
# Search products
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/search?q=laptop

# Get recent searches
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/search/recent

# Get recently viewed products
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/search/recently-viewed
```

## Step 5: Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # E2E tests only

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Redis Connection Issues
- Verify credentials in `.env` file
- Check if Redis Cloud instance is active
- Ensure network connectivity

### Test Failures
- Make sure MongoDB is running
- Ensure Redis connection is established
- Check if server port is available

## New API Endpoints

### Search & Tracking
- `GET /api/search?q={term}` - Search products (tracks search)
- `GET /api/search/recent` - Get recent searches
- `DELETE /api/search/recent` - Clear recent searches
- `GET /api/search/recently-viewed` - Get recently viewed products

### Product Tracking
- `GET /api/products/:id` - View product (tracks viewing)

All endpoints require JWT authentication in headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Files Structure

```
BEEF PROJECT/
├── config/
│   └── redis.js              # Redis configuration & utilities
├── middleware/
│   └── cache.js              # Caching middleware
├── routes/
│   ├── search.js             # Search & tracking routes
│   └── product.js            # Updated with tracking
├── tests/
│   ├── setup.js              # Test configuration
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── jest.config.js            # Jest configuration
├── .env                      # Environment variables
├── REDIS-IMPLEMENTATION.md   # Redis documentation
└── TESTING.md               # Testing documentation
```

## What's New?

✅ Redis Cloud integration  
✅ Recent search tracking  
✅ Recently viewed products  
✅ Product list caching  
✅ Jest unit testing  
✅ Supertest integration testing  
✅ Puppeteer E2E testing  
✅ Comprehensive test coverage  

## Next Steps

1. Install dependencies: `npm install redis @jest/globals jest puppeteer supertest --save-dev`
2. Start server: `npm start`
3. Run tests: `npm test`
4. Build frontend UI for recent searches and recently viewed products
5. Integrate features into your EJS views

For detailed documentation:
- Redis Features: See `REDIS-IMPLEMENTATION.md`
- Testing Guide: See `TESTING.md`
