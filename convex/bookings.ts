import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const getBookings = query({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.db.query("bookings").collect();
        return Promise.all(
            bookings.map(async (booking) => {
                const validEventId = ctx.db.normalizeId("events", booking.eventId);
                const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;

                let userName = booking.customerDetails?.name;
                if (!userName && booking.userId) {
                    const user = await ctx.db
                        .query("users")
                        .withIndex("by_email", (q) => q.eq("email", booking.userId))
                        .unique();
                    if (user) userName = user.name;
                }

                return {
                    ...booking,
                    eventName: event && event.title ? event.title : "Static Event",
                    eventType: event && event.type ? event.type : "Physical",
                    meetingUrl: event && event.meetingUrl ? event.meetingUrl : null,
                    customerEmail: booking.userId, // Map userId to customerEmail for UI compatibility
                    userName: userName || "Guest User",
                };
            })
        );
    },
});

export const getBookingById = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const booking = (await ctx.db.get(args.id as any)) as any;
        if (!booking || !("eventId" in booking)) return null;

        const validEventId = ctx.db.normalizeId("events", booking.eventId);
        const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;

        let userName = booking.customerDetails?.name;
        if (!userName && booking.userId) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", booking.userId))
                .unique();
            if (user) userName = user.name;
        }

        return {
            ...booking,
            eventName: event && "title" in event ? event.title : "Static Event",
            eventType: event && "type" in event ? event.type : "Physical",
            meetingUrl: event && "meetingUrl" in event ? event.meetingUrl : null,
            location: event && "location" in event ? event.location : "TBA",
            userName: userName || "Guest User",
        };
    },
});

export const getBookedSeatsByEvent = query({
    args: { eventId: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .collect();

        // Include Confirmed and Pending bookings, ignore Failed/Cancelled
        const validStatuses = ["Confirmed", "Pending", "Scanned"];
        const validBookings = bookings.filter((b) => validStatuses.includes(b.status));

        const bookedSeatIds = new Set<string>();
        for (const booking of validBookings) {
            if (booking.selectedSeats && Array.isArray(booking.selectedSeats)) {
                for (const seat of booking.selectedSeats) {
                    if (seat && seat.id) {
                        bookedSeatIds.add(seat.id);
                    }
                }
            }
        }

        return Array.from(bookedSeatIds);
    },
});

export const createBooking = mutation({
    args: {
        eventId: v.string(), // changed to string to allow static events
        userId: v.string(),
        ticketCount: v.number(),
        totalPrice: v.number(),
        status: v.string(),
        scanned: v.optional(v.boolean()),
        customerDetails: v.optional(v.object({
            name: v.string(),
            email: v.string(),
            phone: v.string(),
        })),
        selectedSeats: v.optional(v.array(v.object({
            id: v.string(),
            catName: v.string(),
            price: v.number(),
            isFree: v.boolean(),
        }))),
    },
    handler: async (ctx, args) => {
        const bookingId = await ctx.db.insert("bookings", args);

        // Update Organiser Wallet ONLY if status is 'Confirmed'
        if (args.status === 'Confirmed') {
            const validEventId = ctx.db.normalizeId("events", args.eventId);
            let eventName = "Event";
            if (validEventId !== null) {
                const event = (await ctx.db.get(validEventId)) as any;
                if (event) {
                    eventName = event.title || "Event";
                    if (event.organiserId) {
                        const organiser = (await ctx.db
                            .query("organisers")
                            .filter((q) => q.eq(q.field("userId"), event.organiserId))
                            .unique()) as any;
    
                        if (organiser) {
                            await ctx.db.patch(organiser._id, {
                                walletBalance: (organiser.walletBalance || 0) + args.totalPrice,
                            });
                        }
                    }
                }
            }

            const branding = await ctx.db.query("siteBranding").first();
            const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
            let brandLogo = branding?.logoUrl || "/logo.png";
            if (brandLogo.startsWith("/")) {
                brandLogo = `${siteUrl}${brandLogo}`;
            }
            const brandNameDisplay = branding?.name || "BookMyTicket";

            // Send Email Confirmation
            const targetEmail = args.customerDetails?.email || args.userId;
            await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
                to: targetEmail,
                subject: `Booking Confirmed: ${eventName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                        <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px; color: #333; font-size: 24px; font-weight: bold;">
                        <h2 style="color: #333; margin-bottom: 20px;">Tickets Confirmed! 🎉</h2>
                        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Thank you for booking with ${brandNameDisplay}. You have successfully purchased <strong>${args.ticketCount}</strong> ticket(s) for:</p>
                        <div style="font-size: 20px; font-weight: 700; color: #ff007f; margin-bottom: 20px;">${eventName}</div>
                        <p style="color: #555; margin-bottom: 30px;">Total amount paid: <strong>Rs. ${args.totalPrice}</strong></p>
                        <p style="color: #999; font-size: 14px;">You can view your tickets in your account dashboard.</p>
                    </div>
                `,
            });
        }

        return bookingId;
    },
});

export const confirmBooking = mutation({
    args: { id: v.id("bookings") },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.id);
        if (!booking || booking.status === "Confirmed") return;

        await ctx.db.patch(args.id, { status: "Confirmed" });

        // Update Organiser Wallet
        const validEventId = ctx.db.normalizeId("events", booking.eventId);
        let eventName = "Event";
        if (validEventId !== null) {
            const event = (await ctx.db.get(validEventId)) as any;
            if (event) {
                eventName = event.title || "Event";
                if (event.organiserId) {
                    const organiser = (await ctx.db
                        .query("organisers")
                        .filter((q) => q.eq(q.field("userId"), event.organiserId))
                        .unique()) as any;
    
                        if (organiser) {
                            await ctx.db.patch(organiser._id, {
                                walletBalance: (organiser.walletBalance || 0) + booking.totalPrice,
                            });
                        }
                }
            }
        }

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        // Send Email Confirmation
        const targetEmail = booking.customerDetails?.email || booking.userId;
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: targetEmail,
            subject: `Booking Confirmed: ${eventName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                    <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Tickets Confirmed! 🎉</h2>
                    <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Thank you for booking with ${brandNameDisplay}. You have successfully purchased <strong>${booking.ticketCount}</strong> ticket(s) for:</p>
                    <div style="font-size: 20px; font-weight: 700; color: #ff007f; margin-bottom: 20px;">${eventName}</div>
                    <p style="color: #555; margin-bottom: 30px;">Total amount paid: <strong>Rs. ${booking.totalPrice}</strong></p>
                    <p style="color: #999; font-size: 14px;">You can view your tickets in your account dashboard.</p>
                </div>
            `,
        });
    },
});

export const updateBooking = mutation({
    args: { id: v.id("bookings"), scanned: v.boolean() },
    handler: async (ctx, { id, scanned }) => {
        const patch: any = { scanned };
        if (scanned) {
            patch.status = "Scanned";
        }
        await ctx.db.patch(id, patch);
    },
});
