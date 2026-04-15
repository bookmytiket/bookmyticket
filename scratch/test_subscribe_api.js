const fetch = require('node-fetch');

async function testSubscription() {
  const email = `test_${Math.floor(Math.random() * 10000)}@example.com`;
  console.log(`Testing subscription for: ${email}`);
  
  try {
    const res = await fetch('http://localhost:3000/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', data);
    
    if (res.ok && data.success) {
      console.log('✅ Subscription API test passed!');
    } else {
      console.error('❌ Subscription API test failed!');
    }
  } catch (err) {
    console.error('❌ Error connecting to API:', err.message);
  }
}

testSubscription();
