import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const devUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = new ConvexHttpClient(devUrl);

async function testSubmit() {
  try {
    const res = await client.query("partnerRequests:getAll", {});
    console.log("Dev DB Requests:");
    console.log(res.map(r => `${r.firstName} - ${r.email} - ${r.status} - ${new Date(r.createdAt || 0).toISOString()}`));
  } catch (error) {
    console.error("Query failed:", error);
  }
}
testSubmit();
