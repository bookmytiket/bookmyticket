import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const prodUrl = "https://fantastic-sardine-160.convex.cloud";
const client = new ConvexHttpClient(prodUrl);

async function testSubmit() {
  try {
    const res = await client.action("notificationActions:sendBulkGreetingToAll", {
      subject: "Important Newsletter Test",
      message: "Testing the new formatted newsletter UI block."
    });
    console.log("Newsletter Success! Res:", res);
  } catch (error) {
    console.error("Mutation failed:", error);
  }
}
testSubmit();
