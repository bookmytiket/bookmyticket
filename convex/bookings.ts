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

        // Update Organiser Wallet
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

        return bookingId;
    },
});

export const updateBooking = mutation({
    args: { id: v.id("bookings"), scanned: v.boolean() },
    handler: async (ctx, { id, scanned }) => {
        await ctx.db.patch(id, { scanned });
    },
});
