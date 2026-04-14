import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("http://localhost:3210");

async function run() {
    const encoder = new TextEncoder();
    const data = encoder.encode("A@123b@123");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    await client.mutation(api.partnerRequests.approve, {
        id: "placeholder",  // Wait, I can't call approve directly if I need an existing request...
    }).catch(console.log);
}
run();
