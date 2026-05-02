const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testNaN() {
  try {
    const order = await razorpay.orders.create({
      amount: NaN,
      currency: "INR",
      receipt: "test_nan"
    });
    console.log(order);
  } catch (err) {
    console.error("Error with NaN:", err);
  }
}

testNaN();
