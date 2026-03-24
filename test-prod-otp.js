const { ConvexHttpClient } = require('convex/browser');
const client = new ConvexHttpClient('https://rosy-spaniel-218.convex.cloud');

async function test() {
  console.log("Triggering test OTP on PROD...");
  try {
    const result = await client.mutation('auth:testOTP', { email: "testprod@bookmyticket.localhost" });
    console.log("Result:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
