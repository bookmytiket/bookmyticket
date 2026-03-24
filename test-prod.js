const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient('https://rosy-spaniel-218.convex.cloud');

async function test() {
  try {
    const result = await client.query('siteBranding:get', {});
    console.log("PROD Branding Data:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
