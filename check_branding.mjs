import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const prodUrl = "https://fantastic-sardine-160.convex.cloud";
const client = new ConvexHttpClient(prodUrl);

async function check() {
  try {
    const res = await client.query("siteBranding:get", {});
    console.log("Branding Data:", JSON.stringify(res, null, 2));
  } catch (error) {
    console.error("Query failed:", error);
  }
}
check();
