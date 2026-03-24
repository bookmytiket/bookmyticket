require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function test() {
  console.log("Fetching siteBranding...");
  try {
    const result = await client.query('siteBranding:get', {});
    console.log("Branding Data:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
