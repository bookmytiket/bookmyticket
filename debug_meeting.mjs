import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function checkBookings() {
    try {
        const bookings = await client.query(api.bookings.getBookings);
        const target = bookings.find(b => b.eventName === "Coimbatore Online Meeting");
        console.log("Target Booking:", JSON.stringify(target, null, 2));
        
        if (target) {
            const event = await client.query(api.events.getEventById, { eventId: target.eventId });
            console.log("Event Data:", JSON.stringify(event, null, 2));
            
            const meeting = await client.query(api.meetings.getMeetingByEvent, { eventId: target.eventId });
            console.log("Linked Meeting:", JSON.stringify(meeting, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

checkBookings();
