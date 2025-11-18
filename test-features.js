// Test script to verify all backend features
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let sellerToken = '';
let productId = '';
let orderId = '';

console.log('🧪 Testing E-Commerce Backend API\n');
console.log('=' .repeat(50));

// Test 1: Health Check
async function testHealthCheck() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Health Check:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Health Check failed:', error.message);
    return false;
  }
}

// Test 2: User Registration
async function testUserRegistration() {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      address: 'Test Address'
    });
    authToken = response.data.token;
    console.log('✅ User Registration:', response.data.user.name);
    return true;
  } catch (error) {
    console.log('❌ User Registration failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 3: Seller Registration
async function testSellerRegistration() {
  try {
    const response = await axios.post(`${API_URL}/auth/seller/register`, {
      name: 'Test Seller',
      email: `testseller${Date.now()}@example.com`,
      password: 'password123',
      businessName: 'Test Business'
    });
    sellerToken = response.data.token;
    console.log('✅ Seller Registration:', response.data.seller.name);
    return true;
  } catch (error) {
    console.log('❌ Seller Registration failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Get All Products
async function testGetProducts() {
  try {
    const response = await axios.get(`${API_URL}/products`);
    console.log('✅ Get Products:', `${response.data.length} products found`);
    if (response.data.length > 0) {
      productId = response.data[0]._id;
    }
    return true;
  } catch (error) {
    console.log('❌ Get Products failed:', error.message);
    return false;
  }
}

// Test 5: Search Products (Guest - Fixed)
async function testSearchProducts() {
  try {
    const response = await axios.get(`${API_URL}/search?q=laptop`);
    console.log('✅ Search Products (Guest):', `${response.data.products?.length || 0} results`);
    return true;
  } catch (error) {
    console.log('❌ Search Products failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 6: Add Product (Seller)
async function testAddProduct() {
  try {
    const response = await axios.post(`${API_URL}/products`, {
      name: 'Test Product',
      price: 999,
      description: 'Test Description',
      category: 'Electronics',
      stock: 10,
      image: '/uploads/test.jpg'
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    productId = response.data._id;
    console.log('✅ Add Product:', response.data.name);
    return true;
  } catch (error) {
    console.log('❌ Add Product failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 7: Get Product Details
async function testGetProductDetails() {
  if (!productId) {
    console.log('⚠️ Skipping Product Details (no product ID)');
    return false;
  }
  try {
    const response = await axios.get(`${API_URL}/products/${productId}`);
    console.log('✅ Get Product Details:', response.data.name);
    return true;
  } catch (error) {
    console.log('❌ Get Product Details failed:', error.message);
    return false;
  }
}

// Test 8: Add to Cart
async function testAddToCart() {
  if (!productId || !authToken) {
    console.log('⚠️ Skipping Add to Cart (no product/auth)');
    return false;
  }
  try {
    const response = await axios.post(`${API_URL}/cart`, {
      productId,
      quantity: 2
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Add to Cart:', `${response.data.items.length} items in cart`);
    return true;
  } catch (error) {
    console.log('❌ Add to Cart failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 9: Get Cart
async function testGetCart() {
  if (!authToken) {
    console.log('⚠️ Skipping Get Cart (no auth)');
    return false;
  }
  try {
    const response = await axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get Cart:', `${response.data.items.length} items`);
    return true;
  } catch (error) {
    console.log('❌ Get Cart failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 10: Place Order
async function testPlaceOrder() {
  if (!authToken) {
    console.log('⚠️ Skipping Place Order (no auth)');
    return false;
  }
  try {
    const response = await axios.post(`${API_URL}/orders`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    orderId = response.data._id;
    console.log('✅ Place Order:', `Order #${response.data._id.substring(0, 8)}`);
    return true;
  } catch (error) {
    console.log('❌ Place Order failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 11: Get Orders
async function testGetOrders() {
  if (!authToken) {
    console.log('⚠️ Skipping Get Orders (no auth)');
    return false;
  }
  try {
    const response = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get Orders:', `${response.data.length} orders found`);
    return true;
  } catch (error) {
    console.log('❌ Get Orders failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 12: Seller Dashboard
async function testSellerDashboard() {
  if (!sellerToken) {
    console.log('⚠️ Skipping Seller Dashboard (no seller auth)');
    return false;
  }
  try {
    const response = await axios.get(`${API_URL}/seller/products`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    console.log('✅ Seller Dashboard:', `${response.data.length} products`);
    return true;
  } catch (error) {
    console.log('❌ Seller Dashboard failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  console.log('\n1️⃣ Testing Backend Health');
  results.push(await testHealthCheck());
  
  console.log('\n2️⃣ Testing User Registration');
  results.push(await testUserRegistration());
  
  console.log('\n3️⃣ Testing Seller Registration');
  results.push(await testSellerRegistration());
  
  console.log('\n4️⃣ Testing Get Products');
  results.push(await testGetProducts());
  
  console.log('\n5️⃣ Testing Search (Guest Access)');
  results.push(await testSearchProducts());
  
  console.log('\n6️⃣ Testing Add Product (Seller)');
  results.push(await testAddProduct());
  
  console.log('\n7️⃣ Testing Get Product Details');
  results.push(await testGetProductDetails());
  
  console.log('\n8️⃣ Testing Add to Cart');
  results.push(await testAddToCart());
  
  console.log('\n9️⃣ Testing Get Cart');
  results.push(await testGetCart());
  
  console.log('\n🔟 Testing Place Order');
  results.push(await testPlaceOrder());
  
  console.log('\n1️⃣1️⃣ Testing Get Orders');
  results.push(await testGetOrders());
  
  console.log('\n1️⃣2️⃣ Testing Seller Dashboard');
  results.push(await testSellerDashboard());
  
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All features working correctly!');
  } else {
    console.log(`⚠️ ${total - passed} test(s) failed`);
  }
}

runAllTests().catch(console.error);
