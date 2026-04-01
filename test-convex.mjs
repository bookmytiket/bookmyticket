import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function run() {
  try {
    const res = await client.query(api.vendors.getActiveVendors);
    console.log("Success:", res);
  } catch (e) {
    console.error("Convex Error:", e);
  }
}
run();
