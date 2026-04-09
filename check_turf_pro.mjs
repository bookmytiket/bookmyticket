import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const prodUrl = "https://fantastic-sardine-160.convex.cloud";
const client = new ConvexHttpClient(prodUrl);

async function check() {
  try {
    const res = await client.query("organisers:list", {});
    console.log("Total Organisers:", res.length);
    const turfPros = res.filter(o => o.category === "Turf Booking");
    console.log("Turf Booking Organisers:", turfPros.length);
    console.log(JSON.stringify(turfPros.map(o => ({ name: o.name, kyc: o.kycStatus })), null, 2));
  } catch (error) {
    console.error("Query failed:", error);
  }
}
check();
