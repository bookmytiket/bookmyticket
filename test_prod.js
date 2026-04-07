import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Hardcode prod URL or find it
const prodUrl = "https://fantastic-sardine-160.convex.cloud";
const client = new ConvexHttpClient(prodUrl);

async function testSubmit() {
  try {
    const res = await client.mutation("partnerRequests:submitRequest", {
      firstName: "Testing Prod",
      lastName: "test prod",
      email: "cloudtoinfo@gmail.com",
      phone: "1234567890",
      category: "Turf Booking",
      role: "Individual",
      remarks: "Direct API prod test"
    });
    console.log("Prod Success! Request ID:", res);
  } catch (error) {
    console.error("Mutation failed:", error);
  }
}
testSubmit();
