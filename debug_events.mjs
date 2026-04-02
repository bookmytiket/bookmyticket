import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function debugEvents() {
  console.log("Checking events in database...");
  console.log("NEXT_PUBLIC_CONVEX_URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set!");
    return;
  }
  try {
    const events = await client.query(api.events.getActiveEvents);
    console.log(`Found ${events.length} events in total.`);
    events.forEach(e => {
      console.log(`- Title: ${e.title}, City: ${e.city}, Date: ${e.date}, Time: ${e.time}, organiserId: ${e.organiserId}`);
    });
  } catch (err) {
    console.error("Error fetching events:", err);
  }
}

debugEvents();
