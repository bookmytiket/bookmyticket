import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
    process.exit(1);
}

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function run() {
  try {
    const res = await client.query(api.notifications.list);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Convex Error:", e);
  }
}
run();
