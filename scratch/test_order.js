const fetch = require('node-fetch');

async function testCreateOrder() {
  try {
    const res = await fetch('http://localhost:3000/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '12345',
        amount: 10.826,
        type: 'booking'
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

testCreateOrder();
