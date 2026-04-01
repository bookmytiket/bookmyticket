import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function checkMeetings() {
    try {
        console.log("Listing all meetings...");
        const meetings = await client.query(api.meetings.listAll);
        console.log("Total meetings found:", meetings.length);
        
        const coimbatoreMeeting = meetings.find(m => m.title?.toLowerCase().includes("coimbatore") || m.eventId === "jd76ahvc6w3zxjh8wcdnyhrn4183101g");
        if (coimbatoreMeeting) {
            console.log("Found Coimbatore Meeting:", JSON.stringify(coimbatoreMeeting, null, 2));
        } else {
            console.log("NO MEETING FOUND for Coimbatore Online Meeting event.");
            // List titles for debugging
            console.log("Existing meeting titles:", meetings.map(m => m.title));
        }

        console.log("\nChecking for internal links in events...");
        const cleanupResult = await client.mutation(api.meetings.cleanupInternalLinks);
        console.log("Cleanup result:", cleanupResult);

    } catch (error) {
        console.error("Error:", error);
    }
}

checkMeetings();
