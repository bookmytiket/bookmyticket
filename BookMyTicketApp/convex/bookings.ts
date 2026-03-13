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
                return {
                    ...booking,
                    eventName: event && event.title ? event.title : "Static Event",
                    customerEmail: booking.userId, // Map userId to customerEmail for UI compatibility
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

        return {
            ...booking,
            eventName: event && "title" in event ? event.title : "Static Event",
            location: event && "location" in event ? event.location : "TBA",
        };
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
        await ctx.db.patch(id, { scanned });
    },
});
