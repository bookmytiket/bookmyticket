const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient('https://rosy-spaniel-218.convex.cloud');

async function fix() {
  console.log("Updating prod branding...");
  try {
    await client.mutation('siteBranding:update', {
      name: "BookMyTicket",
      logoColor: "#ff007f",
      logoUrl: "https://raw.githubusercontent.com/bookmytiket/bookmyticket/main/public/logo.png",
      siteUrl: "https://bookmyticket.vercel.app"
    });
    console.log("Done updating prod branding.");
  } catch (e) {
    console.error("Error:", e);
  }
}

fix();
