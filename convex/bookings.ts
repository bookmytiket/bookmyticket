import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getBookings = query({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.db.query("bookings").collect();
        return Promise.all(
            bookings.map(async (booking) => {
                const event = await ctx.db.get(booking.eventId);
                return {
                    ...booking,
                    eventName: event ? event.title : "Unknown Event",
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
        const event = (await ctx.db.get(booking.eventId)) as any;
        if (!event || !("title" in event)) return null;
        return {
            ...booking,
            eventName: event.title,
            location: event.location || "TBA",
        };
    },
});

export const createBooking = mutation({
    args: {
        eventId: v.id("events"),
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
            const event = await ctx.db.get(args.eventId);
            if (event && event.organiserId) {
                const organiser = await ctx.db
                    .query("organisers")
                    .filter((q) => q.eq(q.field("userId"), event.organiserId))
                    .unique();

                if (organiser) {
                    await ctx.db.patch(organiser._id, {
                        walletBalance: (organiser.walletBalance || 0) + args.totalPrice,
                    });
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
        const event = await ctx.db.get(booking.eventId);
        if (event && event.organiserId) {
            const organiser = await ctx.db
                .query("organisers")
                .filter((q) => q.eq(q.field("userId"), event.organiserId))
                .unique();

            if (organiser) {
                await ctx.db.patch(organiser._id, {
                    walletBalance: (organiser.walletBalance || 0) + booking.totalPrice,
                });
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
