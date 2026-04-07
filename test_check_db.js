import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const prodUrl = "https://fantastic-sardine-160.convex.cloud";
const client = new ConvexHttpClient(prodUrl);

async function testSubmit() {
  try {
    const res = await client.query("partnerRequests:getAll", {});
    console.log("Prod DB Requests:");
    console.log(res.map(r => `${r.firstName} - ${r.email} - ${r.status}`));
  } catch (error) {
    console.error("Query failed:", error);
  }
}
testSubmit();
