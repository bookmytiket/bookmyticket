require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function test() {
  console.log("Triggering test email...");
  try {
    const result = await client.mutation('auth:testOTP', { email: "test@bookmyticket.localhost" });
    console.log("Result:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
