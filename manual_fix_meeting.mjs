import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function createManualMeeting() {
    try {
        const eventId = "jd76ahvc6w3zxjh8wcdnyhrn4183101g";
        console.log("Creating meeting for Coimbatore Online Meeting (Event ID:", eventId, ")");
        
        const link = await client.mutation(api.meetings.createForEvent, {
            eventId,
            title: "Coimbatore Online Meeting",
            creatorId: "rajavasu97@gmail.com", // Found in debug_meeting.mjs
            description: "Session for Coimbatore Online Meeting"
        });
        
        console.log("SUCCESS! Created meeting with link:", link);
        
        // Now check if getByUser returns it
        const bookings = await client.query(api.bookings.getByUser, { userId: "rajavasu97@gmail.com" });
        const target = bookings.find(b => b.eventName === "Coimbatore Online Meeting");
        console.log("Updated Booking Data from getByUser:", JSON.stringify(target, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

createManualMeeting();
