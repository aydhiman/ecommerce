# E-Commerce Platform - Test Suite

## Overview
Comprehensive unit and integration tests for authentication (register and login) functionality.

## Test Files

### 1. `register.test.js` - User & Seller Registration Tests
Tests all registration scenarios including:
- ✅ Successful user registration
- ✅ Successful seller registration
- ❌ Duplicate phone/email validation
- ❌ Invalid input validation (short password, invalid email, etc.)
- ❌ Missing required fields

### 2. `login.test.js` - User & Seller Login Tests
Tests all login scenarios including:
- ✅ Successful user login
- ✅ Successful seller login
- ❌ Invalid credentials (wrong password, non-existent user)
- ❌ Missing credentials
- ✅ JWT token validation
- ✅ Get current user info with token
- ✅ Logout functionality

## Test Coverage

### User Registration (7 tests)
1. Register with valid data
2. Reject duplicate phone number
3. Reject invalid phone number (too short)
4. Reject short password
5. Reject missing required fields
6. Reject short name
7. Reject short address

### Seller Registration (5 tests)
1. Register with valid data
2. Reject duplicate email
3. Reject invalid email format
4. Reject short password
5. Reject missing required fields

### User Login (7 tests)
1. Login with valid credentials
2. Reject incorrect password
3. Reject non-existent phone
4. Reject missing phone
5. Reject missing password
6. Reject empty credentials
7. Validate JWT token format

### Seller Login (6 tests)
1. Login with valid credentials
2. Reject incorrect password
3. Reject non-existent email
4. Reject missing email
5. Reject missing password
6. Validate JWT token format

### Authentication Endpoints (4 tests)
1. Get current user with valid token
2. Reject request without token
3. Reject invalid token
4. Get current seller with valid token
5. Logout successfully

**Total: 30 comprehensive tests**

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run with coverage report
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test register.test.js
npm test login.test.js
```

## Test Database

Tests use a separate test database: `ecommerce-test`

**Configuration:**
- MongoDB URI: `mongodb://localhost:27017/ecommerce-test`
- Automatic cleanup after each test
- Isolated from production/development data

## Prerequisites

1. **MongoDB** must be running locally on port 27017
2. **Redis** (optional) - tests work without Redis
3. **Node.js** 18+
4. **Dependencies installed:**
```bash
npm install
```

## Test Environment Setup

Tests use `.env.test` configuration:
```
NODE_ENV=test
PORT=5001
MONGODB_TEST_URI=mongodb://localhost:27017/ecommerce-test
JWT_SECRET=test-secret-key-for-testing
```

## Test Structure

Each test file follows this pattern:

```javascript
describe('Feature Group', () => {
  beforeAll(() => {
    // Setup: Connect to test DB
  });

  afterAll(() => {
    // Cleanup: Close connections
  });

  beforeEach(() => {
    // Reset: Clean data before each test
  });

  test('should do something', async () => {
    // Arrange: Setup test data
    // Act: Perform action
    // Assert: Verify results
  });
});
```

## Expected Results

When all tests pass, you should see:

```
PASS  __test__/register.test.js
  User Registration Tests
    POST /api/auth/register - User Registration
      ✓ should register a new user successfully with valid data
      ✓ should not register user with existing phone number
      ✓ should not register user with invalid phone number
      ✓ should not register user with short password
      ✓ should not register user with missing required fields
      ✓ should not register user with short name
      ✓ should not register user with short address
    POST /api/auth/seller/register - Seller Registration
      ✓ should register a new seller successfully with valid data
      ✓ should not register seller with existing email
      ✓ should not register seller with invalid email format
      ✓ should not register seller with short password
      ✓ should not register seller with missing required fields

PASS  __test__/login.test.js
  Login Tests
    POST /api/auth/login - User Login
      ✓ should login user successfully with valid credentials
      ✓ should not login with incorrect password
      ✓ should not login with non-existent phone number
      ✓ should not login with missing phone number
      ✓ should not login with missing password
      ✓ should not login with empty credentials
      ✓ should return valid JWT token on successful login
    POST /api/auth/seller/login - Seller Login
      ✓ should login seller successfully with valid credentials
      ✓ should not login seller with incorrect password
      ✓ should not login seller with non-existent email
      ✓ should not login seller with missing email
      ✓ should not login seller with missing password
      ✓ should return valid JWT token on successful seller login
    GET /api/auth/me - Get Current User
      ✓ should get current user info with valid token
      ✓ should not get user info without token
      ✓ should not get user info with invalid token
      ✓ should get current seller info with valid token
    POST /api/auth/logout - Logout
      ✓ should logout successfully

Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
```

## Troubleshooting

### MongoDB Connection Error
**Problem:** Cannot connect to MongoDB
**Solution:** Ensure MongoDB is running:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### Port Already in Use
**Problem:** Test port 5001 is busy
**Solution:** Change PORT in `.env.test`

### Tests Timeout
**Problem:** Tests taking too long
**Solution:** Increase timeout in `jest.config.js`:
```javascript
testTimeout: 60000  // 60 seconds
```

### Redis Connection Errors
**Problem:** Redis connection failures
**Solution:** Tests are designed to work without Redis. Errors are logged but don't fail tests.

## Best Practices

1. **Isolation:** Each test is independent
2. **Cleanup:** Database is cleaned before/after tests
3. **Descriptive:** Test names clearly describe what's being tested
4. **Comprehensive:** Cover both success and failure cases
5. **Fast:** Tests complete in seconds

## Contributing

When adding new tests:
1. Follow the existing structure
2. Use descriptive test names
3. Test both positive and negative scenarios
4. Clean up test data
5. Update this README

## Technologies Used

- **Jest** - Testing framework
- **Supertest** - HTTP assertions
- **MongoDB** - Test database
- **Mongoose** - ODM for MongoDB

## Author

Team: Ayush, Chetan, Arushi  
Project: E-Commerce Platform  
Date: November 2025
