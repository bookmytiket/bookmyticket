import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
            if (validEventId !== null) {
                const event = (await ctx.db.get(validEventId)) as any;
                if (event && event.organiserId) {
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
        if (validEventId !== null) {
            const event = (await ctx.db.get(validEventId)) as any;
            if (event && event.organiserId) {
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
