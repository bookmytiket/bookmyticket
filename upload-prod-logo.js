const { ConvexHttpClient } = require('convex/browser');
const fs = require('fs');

const client = new ConvexHttpClient('https://rosy-spaniel-218.convex.cloud');

async function run() {
  console.log("Reading local logo.png...");
  const buffer = fs.readFileSync('./public/logo.png');

  console.log("Generating upload URL...");
  const url = await client.mutation('branding:generateUploadUrl', {});

  console.log("Uploading to Convex Storage...");
  // Using native fetch in Node 18+
  const uploadRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: buffer,
  });

  const { storageId } = await uploadRes.json();
  console.log("Storage ID:", storageId);

  const logoUrl = await client.query('siteBranding:getUrl', { storageId });
  console.log("Convex Storage Logo URL:", logoUrl);

  console.log("Updating prod branding...");
  await client.mutation('siteBranding:update', {
    name: "BookMyTicket",
    logoColor: "#ff007f",
    logoUrl: logoUrl,
    siteUrl: "https://bookmyticket.vercel.app"
  });

  console.log("Done updating prod branding with Convex Storage URL.");
}

run();
