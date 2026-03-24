const { ConvexHttpClient } = require('convex/browser');
const client = new ConvexHttpClient('https://rosy-spaniel-218.convex.cloud');

async function fix() {
  try {
    await client.mutation('siteBranding:update', {
      name: "BookMyTicket",
      logoColor: "#ff007f",
      logoUrl: "https://raw.githubusercontent.com/bookmytiket/bookmyticket/main/public/logo.png",
      siteUrl: "https://bookmyticket.vercel.app"
    });
    console.log("Success!");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
fix();
