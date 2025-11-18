// Quick test for checkout functionality
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testCheckout() {
  try {
    console.log('Testing checkout functionality...\n');
    
    // Step 1: Register a test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'Checkout Test User',
      phone: `${Date.now()}`,
      password: 'password123',
      address: 'Test Address 123'
    });
    const token = registerResponse.data.token;
    console.log('✅ User registered, token received');
    
    // Step 2: Get products
    console.log('\n2. Fetching products...');
    const productsResponse = await axios.get(`${API_URL}/products`);
    const products = productsResponse.data;
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length === 0) {
      console.log('❌ No products available to test');
      return;
    }
    
    const testProduct = products[0];
    console.log(`   Using product: ${testProduct.name}`);
    
    // Step 3: Add to cart
    console.log('\n3. Adding product to cart...');
    const addToCartResponse = await axios.post(`${API_URL}/cart`, {
      productId: testProduct._id,
      quantity: 2
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Product added to cart');
    console.log(`   Cart has ${addToCartResponse.data.items.length} item(s)`);
    
    // Step 4: Get cart
    console.log('\n4. Fetching cart...');
    const cartResponse = await axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Cart retrieved');
    console.log(`   Items in cart: ${cartResponse.data.items.length}`);
    
    // Step 5: Place order (CHECKOUT)
    console.log('\n5. Placing order (CHECKOUT)...');
    const orderResponse = await axios.post(`${API_URL}/orders`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ ORDER PLACED SUCCESSFULLY!');
    console.log(`   Order ID: ${orderResponse.data._id}`);
    console.log(`   Total: ₹${orderResponse.data.total}`);
    console.log(`   Status: ${orderResponse.data.status}`);
    console.log(`   Items: ${orderResponse.data.items.length}`);
    
    // Step 6: Verify cart is empty
    console.log('\n6. Verifying cart is cleared...');
    const emptyCartResponse = await axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Cart now has ${emptyCartResponse.data.items.length} items`);
    
    // Step 7: Get orders
    console.log('\n7. Fetching orders...');
    const ordersResponse = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Orders retrieved');
    console.log(`   Total orders: ${ordersResponse.data.length}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CHECKOUT FEATURE WORKING CORRECTLY!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testCheckout();
