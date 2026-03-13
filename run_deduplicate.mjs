
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function runDeduplicate() {
    console.log("Running deduplication...");
    try {
        const result = await client.mutation(api.emailTemplates.deduplicate, {});
        console.log("Deduplication complete:", result);
    } catch (err) {
        console.error("Deduplication failed:", err);
    }
}

runDeduplicate();
